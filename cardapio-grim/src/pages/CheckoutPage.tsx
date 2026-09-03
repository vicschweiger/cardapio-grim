import { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Store, Loader2, AlertCircle } from 'lucide-react';

import { CatalogContext } from '../context/CatalogContext.tsx';
import { CheckoutHeader } from '../components/checkout/CheckoutHeader.tsx';
import { CheckoutEmptyState } from '../components/checkout/CheckoutEmptyState.tsx';
import { CheckoutSuccessState } from '../components/checkout/CheckoutSuccessState.tsx';
import { CheckoutCustomerForm } from '../components/checkout/CheckoutCustomerForm.tsx';
import { CheckoutDeliveryForm } from '../components/checkout/CheckoutDeliveryForm.tsx';
import { CheckoutPaymentForm } from '../components/checkout/CheckoutPaymentForm.tsx';
import { CheckoutSummary } from '../components/checkout/CheckoutSummary.tsx';
import { CheckoutPixState } from '../components/checkout/CheckoutPixState.tsx';
import { MercadoPagoReturnState } from '../components/checkout/MercadoPagoReturnState.tsx';
import { CheckoutApiError, createDeliveryOrder, createMercadoPagoCheckout, getPaymentConfig } from '../api/checkout.ts';
import type { CartItem } from '../types/index.tsx';
import type {
  AppliedCoupon,
  CreatedOrderResponse,
  DeliveryOrderPayload,
  MercadoPagoCheckoutPayload,
  MercadoPagoCheckoutResponse,
  MercadoPagoReturnResult,
  PaymentConfig,
  PaymentMethod,
} from '../types/checkout.ts';
import { PrivacyFooter } from '../privacy/PrivacyFooter.tsx';
import { useLegalDocuments } from '../privacy/LegalDocumentsContext.tsx';
import { legalDocumentHref } from '../privacy/legalNavigation.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api';

const DELIVERY_ONLY_PAYMENT_CONFIG: PaymentConfig = {
  pix: { enabled: false, key: '', key_type: '', receiver_name: '' },
  mercadopago: { enabled: false, connected: false, pix_enabled: false, card_enabled: false },
  money: { enabled: true },
  card_on_delivery: { enabled: true },
};

const cartSignatureFor = (items: CartItem[]) => items
  .map(item => `${String(item.id)}:${item.quantity}`)
  .sort()
  .join('|');

const isAppliedCoupon = (value: unknown): value is AppliedCoupon => {
  if (!value || typeof value !== 'object') return false;
  const coupon = value as Partial<AppliedCoupon>;
  return (
    typeof coupon.code === 'string'
    && ['percentage', 'fixed', 'free_shipping'].includes(coupon.discount_type || '')
    && Number.isFinite(Number(coupon.discount_amount))
    && typeof coupon.cart_signature === 'string'
  );
};

// Utilitário para Capitalizar Nomes corretamente
const capitalizeName = (name: string) => {
  if (!name) return '';
  const prepositions = ['da', 'de', 'do', 'das', 'dos', 'e'];
  return name
    .toLowerCase()
    .split(' ')
    .map(word => 
      prepositions.includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
};

export default function CheckoutPage() {
  const { company_slug } = useParams<{ company_slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getDocument } = useLegalDocuments();
  const privacyDocument = getDocument('privacy');
  
  const context = useContext(CatalogContext);
  if (!context) throw new Error("CheckoutPage deve ser renderizada dentro de um CatalogProvider");

  const { catalog, cart, clearCart, fetchCatalog, removeFromCart, handleAddToCart, handleSubtractFromCart } = context;

  // 🛡️ INICIALIZAÇÃO BLINDADA (Ignora cache velho ou corrompido)
  const [initialData] = useState(() => {
    const navState = location.state as any;
    
    let name = navState?.customerName || '';
    let phone = navState?.customerPhone || '';
    let pickup = navState?.isPickup || false;
    let fee = navState?.deliveryFee || 0;
    
    let address = navState?.customerAddressInfo;

    try {
      const stored = sessionStorage.getItem(`deliveryInfo_${company_slug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        if (!address || typeof address !== 'object' || Object.keys(address).length === 0) {
          if (parsed.addressInfo && typeof parsed.addressInfo === 'object' && !Array.isArray(parsed.addressInfo)) {
            address = parsed.addressInfo;
          }
        }
        
        if (!name && parsed.customerName) name = parsed.customerName;
        if (!phone && parsed.customerPhone) phone = parsed.customerPhone;
        if (navState?.isPickup === undefined && parsed.isPickup !== undefined) pickup = parsed.isPickup;
        if (navState?.deliveryFee === undefined && parsed.deliveryFee !== undefined) fee = parsed.deliveryFee;
      }
    } catch (e) {
      console.error("Erro ao ler sessão no checkout", e);
    }

    if (typeof address !== 'object' || address === null) {
      address = {};
    }

    if (!address.street && address.full) {
      const parts = address.full.split(','); 
      address.street = parts[0]?.trim() || address.full;
      
      if (parts[1]) {
        address.number = parts[1].trim().split(/[ -]/)[0] || '';
      }
      
      const cepMatch = address.full.match(/\d{5}-?\d{3}/);
      if (cepMatch) address.cep = cepMatch[0];
    }

    return {
      address,
      name,
      phone,
      pickup,
      fee,
      discount: navState?.discount || 0,
      coupon: navState?.coupon || null
    };
  });

  // ESTADOS DOS FORMULÁRIOS
  const [customerName, setCustomerName] = useState(capitalizeName(initialData.name));
  const [customerPhone, setCustomerPhone] = useState(initialData.phone);
  const [isPickup, setIsPickup] = useState(initialData.pickup);
  
  const [deliveryCep, setDeliveryCep] = useState(initialData.address.cep || '');
  const [deliveryStreet, setDeliveryStreet] = useState(initialData.address.street || '');
  const [deliveryNumber, setDeliveryNumber] = useState(initialData.address.number || '');
  const [deliveryComplement, setDeliveryComplement] = useState('');
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState(initialData.address.neighborhood || '');
  const [deliveryCity, setDeliveryCity] = useState(initialData.address.city || '');
  const [deliveryState, setDeliveryState] = useState(initialData.address.state || '');
  
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [changeForStr, setChangeForStr] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [isPaymentConfigLoading, setPaymentConfigLoading] = useState(true);
  const [paymentConfigError, setPaymentConfigError] = useState<string | null>(null);
  const [paymentConfigRequest, setPaymentConfigRequest] = useState(0);
  
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => (
    isAppliedCoupon(initialData.coupon) ? initialData.coupon : null
  ));
  const [couponInvalidated, setCouponInvalidated] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState<number | null>(null);
  const [pixOrder, setPixOrder] = useState<CreatedOrderResponse | null>(null);
  const [mercadoPagoCheckout, setMercadoPagoCheckout] = useState<MercadoPagoCheckoutResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const checkoutIdempotencyKey = useRef(crypto.randomUUID());

  const mercadoPagoReturn = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const result = params.get('payment_result');
    const orderId = Number(params.get('grim_order_id'));
    if (!['success', 'pending', 'failure'].includes(result || '') || !Number.isSafeInteger(orderId) || orderId <= 0) return null;
    return { result: result as MercadoPagoReturnResult, orderId };
  }, [location.search]);

  useEffect(() => {
    if (!company_slug || mercadoPagoReturn) return;
    const controller = new AbortController();
    setPaymentConfigLoading(true);
    setPaymentConfigError(null);

    getPaymentConfig(company_slug, controller.signal)
      .then(config => {
        setPaymentConfig(config);
        const enabledMethods: PaymentMethod[] = [];
        if (config.money?.enabled !== false) enabledMethods.push('money');
        if (config.card_on_delivery?.enabled !== false) enabledMethods.push('card');
        if (config.pix.enabled) enabledMethods.push('pix_manual');
        if (config.mercadopago.enabled && config.mercadopago.connected && (config.mercadopago.pix_enabled || config.mercadopago.card_enabled)) enabledMethods.push('mercadopago');
        setPaymentMethod(current => current && enabledMethods.includes(current) ? current : enabledMethods[0] || null);
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (error instanceof CheckoutApiError && error.status === 404) {
          setPaymentConfig(DELIVERY_ONLY_PAYMENT_CONFIG);
          setPaymentMethod('money');
          setPaymentConfigError(null);
          return;
        }
        setPaymentConfig(null);
        setPaymentMethod(null);
        setPaymentConfigError(error instanceof Error ? error.message : 'Não foi possível carregar as formas de pagamento.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setPaymentConfigLoading(false);
      });

    return () => controller.abort();
  }, [company_slug, mercadoPagoReturn, paymentConfigRequest]);

  // ESTADOS DO FRETE E BLOQUEIO
  const [deliveryFee, setDeliveryFee] = useState(initialData.fee);
  const [isDeliveryBlocked, setDeliveryBlocked] = useState(!(initialData.fee > 0 || initialData.pickup));

  // 🔴 CÁLCULO INTELIGENTE DE PRODUTOS INATIVOS
  const inactiveCartItems = useMemo(() => {
    if (!catalog || !cart) return [];
    const inactive: string[] = [];
    
    cart.forEach(cartItem => {
      let isItemActiveAndAvailable = false;
      
      for (const category of catalog.categories) {
        const matchedProduct = category.products.find(p => {
          if (p.id && cartItem.id && p.id === cartItem.id) return true;
          const catalogName = p.name ? p.name.toLowerCase().trim() : '';
          const cartName = cartItem.name ? cartItem.name.toLowerCase().trim() : '';
          return catalogName === cartName;
        });

        if (matchedProduct) {
          if (matchedProduct.is_active !== false) {
            isItemActiveAndAvailable = true;
          }
          break; 
        }
      }
      
      if (!isItemActiveAndAvailable) {
        inactive.push(cartItem.name);
      }
    });

    return inactive;
  }, [cart, catalog]);

  // Cálculos Financeiros
  const subtotal = useMemo(() => cart.reduce((acc, item) => {
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
    return acc + ((isNaN(itemPrice) ? 0 : itemPrice) * item.quantity);
  }, 0), [cart]);
  const cartSignature = useMemo(() => cartSignatureFor(cart), [cart]);
  const currentCouponCep = deliveryCep.replace(/\D/g, '');
  const currentCouponDeliveryFee = isPickup ? 0 : deliveryFee;
  const couponEnabled = catalog?.modules?.coupon_mode === true;
  const activeCoupon = couponEnabled && appliedCoupon
    && appliedCoupon.cart_signature === cartSignature
    && appliedCoupon.delivery_fee === currentCouponDeliveryFee
    && appliedCoupon.delivery_cep === currentCouponCep
    ? appliedCoupon
    : null;

  const serviceFee = 0; 
  const discountValue = useMemo(
    () => Math.max(0, Number(activeCoupon?.discount_amount) || 0),
    [activeCoupon],
  );
  const totalAmount = useMemo(() => Math.max(0, subtotal + (isPickup ? 0 : deliveryFee) + serviceFee - discountValue), [subtotal, deliveryFee, isPickup, serviceFee, discountValue]);
  const minimumOrder = Math.max(0, Number(catalog?.min_order) || 0);
  const orderValueWithoutDelivery = Math.max(0, subtotal + serviceFee - discountValue);
  const isBelowMinimumOrder = minimumOrder > 0 && orderValueWithoutDelivery < minimumOrder;

  useEffect(() => {
    if (!appliedCoupon) return;
    if (catalog && !couponEnabled) {
      setAppliedCoupon(null);
      setCouponInvalidated(false);
      return;
    }
    const couponIsStale = (
      appliedCoupon.cart_signature !== cartSignature
      || appliedCoupon.delivery_fee !== currentCouponDeliveryFee
      || appliedCoupon.delivery_cep !== currentCouponCep
    );
    if (couponIsStale) {
      setAppliedCoupon(null);
      setCouponInvalidated(true);
    }
  }, [appliedCoupon, cartSignature, catalog, couponEnabled, currentCouponCep, currentCouponDeliveryFee]);

  // VALIDAÇÃO DO TROCO 
  const changeForNumber = changeForStr ? parseFloat(changeForStr.replace(/\./g, '').replace(',', '.')) : 0;
  const isChangeInvalid = paymentMethod === 'money' && changeForStr.length > 0 && changeForNumber < totalAmount;

  const getChangeForAsNumber = () => {
    if (!changeForStr) return 0;
    const val = parseFloat(changeForStr.replace(/\./g, '').replace(',', '.'));
    return isNaN(val) ? 0 : val;
  };

  const handleChangeForInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); 
    if (!value) return setChangeForStr('');
    const numberValue = (parseInt(value, 10) / 100).toFixed(2);
    setChangeForStr(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(numberValue)));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !catalog) return;
    if (!paymentMethod || !paymentConfig) return setSubmitError('Selecione uma forma de pagamento disponível.');

    if (!catalog.is_open) return alert("O estabelecimento encontra-se fechado. Não é possível enviar pedidos.");
    if (customerPhone.replace(/\D/g, '').length < 10) return alert("Por favor, insira um número de celular válido.");
    if (!isPickup && isDeliveryBlocked) return alert("Por favor, verifique o seu endereço. A entrega não está disponível para esta localização.");
    if (inactiveCartItems.length > 0) return alert("Por favor, remova os itens indisponíveis do carrinho antes de finalizar o pedido.");
    if (isChangeInvalid) return alert("Por favor, digite um valor de troco válido.");
    if (isBelowMinimumOrder) {
      return setSubmitError(`O pedido mínimo é ${formatCurrency(minimumOrder)} sem considerar a taxa de entrega.`);
    }
    if (mercadoPagoCheckout) return;

    const mercadoPagoWindow = paymentMethod === 'mercadopago'
      ? window.open('about:blank', '_blank', 'popup=yes,width=520,height=760')
      : null;
    if (mercadoPagoWindow) {
      mercadoPagoWindow.document.title = 'Mercado Pago';
      mercadoPagoWindow.document.body.textContent = 'Preparando seu pagamento seguro...';
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const checkStatusRes = await fetch(`${API_BASE_URL}/catalog/${company_slug}/`);
        if (checkStatusRes.ok) {
          const checkStatusData = await checkStatusRes.json();
          if (!checkStatusData.is_open) {
             mercadoPagoWindow?.close();
             alert("⚠️ O estabelecimento acabou de fechar! Não é possível enviar o pedido neste momento.");
             if (fetchCatalog) fetchCatalog(company_slug!, true);
             return setIsSubmitting(false);
          }
          const currentMinimumOrder = Math.max(0, Number(checkStatusData.min_order) || 0);
          if (currentMinimumOrder > 0 && orderValueWithoutDelivery < currentMinimumOrder) {
            mercadoPagoWindow?.close();
            if (fetchCatalog) void fetchCatalog(company_slug!, true);
            setSubmitError(`O pedido mínimo foi atualizado para ${formatCurrency(currentMinimumOrder)} sem considerar a taxa de entrega.`);
            return setIsSubmitting(false);
          }
        }
      } catch (err) { console.warn("Pre-flight check falhou, prosseguindo...", err); }

      const formattedItems = cart.map(item => ({
        produto: item.name,
        qtd: item.quantity,
        preco: isNaN(Number(item.price)) ? 0 : Number(item.price),
        obs: (item as any).obs || ""
      }));

      const finalPaymentMethod: DeliveryOrderPayload['payment_method'] = paymentMethod === 'card'
        ? (cardType === 'credit' ? 'card_credit' : 'card_debit')
        : paymentMethod === 'mercadopago' ? 'money' : paymentMethod;

      const fullDeliveryAddress = isPickup 
        ? "Retirada no Balcão" 
        : `${deliveryStreet}, ${deliveryNumber}${deliveryComplement ? ` - ${deliveryComplement}` : ''} • ${deliveryNeighborhood} • ${deliveryCity}/${deliveryState} (CEP: ${deliveryCep})`;

      const isMercadoPago = paymentMethod === 'mercadopago';
      const mercadoPagoItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        obs: (item as any).obs || ""
      }));
      const commonPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        is_pickup: isPickup,
        delivery_address: fullDeliveryAddress,
        delivery_cep: deliveryCep,
        delivery_street: deliveryStreet,
        delivery_number: deliveryNumber,
        delivery_complement: deliveryComplement,
        delivery_neighborhood: deliveryNeighborhood,
        delivery_city: deliveryCity,
        delivery_state: deliveryState,
        delivery_instructions: deliveryInstructions,
      };
      const mercadoPagoPayload: MercadoPagoCheckoutPayload = {
        ...commonPayload,
        items: mercadoPagoItems,
        payment_method: 'mercadopago',
      };
      const deliveryOrderPayload: DeliveryOrderPayload = {
        ...commonPayload,
        items: formattedItems,
        subtotal, delivery_fee: isPickup ? 0 : deliveryFee, service_fee: serviceFee, total_amount: totalAmount,
        payment_method: finalPaymentMethod,
        change_for: paymentMethod === 'money' && changeForStr ? getChangeForAsNumber() : null,
        is_paid: false,
        status: 'new',
        coupon_applied: activeCoupon?.code || null
      };

      if (isMercadoPago) {
        const result = await createMercadoPagoCheckout(company_slug!, mercadoPagoPayload, checkoutIdempotencyKey.current);
        if (!result.init_point || !result.preference_id) throw new Error('Resposta de pagamento inválida.');
        const mercadoPagoUrl = new URL(result.init_point);
        if (!(mercadoPagoUrl.hostname === 'mercadopago.com.br' || mercadoPagoUrl.hostname.endsWith('.mercadopago.com.br'))) {
          throw new Error('O backend retornou um endereço de pagamento inválido.');
        }
        setMercadoPagoCheckout(result);
        if (mercadoPagoWindow && !mercadoPagoWindow.closed) {
          mercadoPagoWindow.opener = null;
          mercadoPagoWindow.location.replace(mercadoPagoUrl.href);
        }
        requestAnimationFrame(() => document.getElementById('checkout-payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        return;
      }

      const result = await createDeliveryOrder(company_slug!, deliveryOrderPayload);
      if (!Number.isSafeInteger(Number(result.order_id))) throw new Error('O backend não retornou um pedido válido.');
      if (paymentMethod === 'pix_manual') {
        if (!result.pix_code || !result.pix_qr_code || result.total_amount === undefined) {
          throw new Error('O backend não retornou os dados necessários para o pagamento PIX.');
        }
        setPixOrder(result);
      } else {
        setOrderCreatedId(result.order_id);
      }
      clearCart();
    } catch (error) {
      mercadoPagoWindow?.close();
      setSubmitError(error instanceof Error ? error.message : 'Erro de conexão ao enviar o pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (mercadoPagoReturn) return (
    <MercadoPagoReturnState
      companySlug={company_slug!}
      orderId={mercadoPagoReturn.orderId}
      returnResult={mercadoPagoReturn.result}
      onOrderFound={clearCart}
      onBackToMenu={() => navigate(`/${company_slug}`)}
    />
  );
  if (pixOrder) return <CheckoutPixState order={pixOrder} companySlug={company_slug!} onBackToMenu={() => navigate(`/${company_slug}`)} />;
  if (orderCreatedId) return <CheckoutSuccessState orderId={orderCreatedId} companySlug={company_slug!} />;
  if (cart.length === 0) return <CheckoutEmptyState companySlug={company_slug!} />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      <CheckoutHeader companySlug={company_slug!} logoUrl={catalog?.logo_url} companyName={catalog?.name || ''} catalogName={catalog?.name} />

      <div className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LADO ESQUERDO: FORMULÁRIOS */}
        <form onSubmit={handlePlaceOrder} id="checkout-form" className="lg:col-span-7 space-y-6">
          
          {catalog && !catalog.is_open && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 items-start animate-fade-in-up shadow-sm">
              <Store className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Estabelecimento Fechado</h4>
                <p className="text-xs mt-1">Você não pode finalizar o pedido neste momento pois a loja encontra-se fechada. Tente novamente mais tarde.</p>
              </div>
            </div>
          )}

          {inactiveCartItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start animate-fade-in-up shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <h4 className="font-bold text-sm text-amber-900">Atenção aos itens do seu pedido</h4>
                <p className="text-xs mt-1 text-amber-800">
                  Parece que alguns produtos esgotaram ou não estão mais disponíveis no cardápio:
                </p>
                <ul className="mt-2 list-disc list-inside text-xs font-bold text-amber-700 space-y-1 bg-amber-100/50 p-2 rounded-lg">
                  {inactiveCartItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="text-xs mt-3 font-semibold text-amber-900 flex items-center gap-1">
                  Por favor, retorne ao cardápio ou os remova do carrinho.
                </p>
              </div>
            </div>
          )}

          {couponEnabled && couponInvalidated && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
              <p className="font-bold">O cupom foi removido.</p>
              <p className="mt-1 text-xs">O carrinho ou o endereço de entrega mudou. Volte ao cardápio e aplique o cupom novamente.</p>
              <button type="button" onClick={() => navigate(`/${company_slug}`)} className="mt-3 font-bold text-amber-950 underline underline-offset-2">
                Voltar ao cardápio
              </button>
            </div>
          )}

          <CheckoutCustomerForm customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} />
          
          <CheckoutDeliveryForm 
            isPickup={isPickup} 
            setIsPickup={setIsPickup} 
            deliveryCep={deliveryCep}
            setDeliveryCep={setDeliveryCep}
            deliveryStreet={deliveryStreet}
            setDeliveryStreet={setDeliveryStreet}
            deliveryNumber={deliveryNumber}
            setDeliveryNumber={setDeliveryNumber}
            deliveryComplement={deliveryComplement}
            setDeliveryComplement={setDeliveryComplement}
            deliveryNeighborhood={deliveryNeighborhood}
            setDeliveryNeighborhood={setDeliveryNeighborhood}
            deliveryCity={deliveryCity}
            setDeliveryCity={setDeliveryCity}
            deliveryState={deliveryState}
            setDeliveryState={setDeliveryState}
            deliveryInstructions={deliveryInstructions} 
            setDeliveryInstructions={setDeliveryInstructions} 
            companyToken={company_slug!}
            onDeliveryCalculated={(fee) => setDeliveryFee(fee)}
            setDeliveryBlocked={setDeliveryBlocked}
          />
          
          <CheckoutPaymentForm 
            paymentMethod={paymentMethod} 
            setPaymentMethod={setPaymentMethod} 
            cardType={cardType} 
            setCardType={setCardType} 
            changeForStr={changeForStr} 
            handleChangeForInput={handleChangeForInput} 
            totalAmount={totalAmount} 
            paymentConfig={paymentConfig}
            isLoading={isPaymentConfigLoading}
            error={paymentConfigError}
            onRetry={() => setPaymentConfigRequest(value => value + 1)}
            mercadoPagoCheckout={mercadoPagoCheckout}
            isSubmitting={isSubmitting}
          />

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">
            Seus dados serão usados pelo estabelecimento e pela Grim para processar e acompanhar este pedido. Consulte a <Link to={legalDocumentHref('privacy', company_slug)} target="_blank" rel="noreferrer" className="font-bold text-teal-800 underline underline-offset-2 focus:outline-none focus:ring-4 focus:ring-teal-100">Política de Privacidade{privacyDocument ? ` — versão ${privacyDocument.version}` : ''}</Link>.
          </aside>

          {submitError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700" role="alert">{submitError}</p>}

          <div className="lg:hidden">
            <button 
              type="submit" 
              disabled={isSubmitting || catalog?.is_open === false || (!isPickup && isDeliveryBlocked) || inactiveCartItems.length > 0 || isChangeInvalid || !paymentMethod || !paymentConfig || isBelowMinimumOrder || Boolean(mercadoPagoCheckout)}
              className="w-full bg-teal-600 text-white rounded-xl py-3.5 font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : inactiveCartItems.length > 0 ? (
                "Remova itens indisponíveis"
              ) : (!isPickup && isDeliveryBlocked) ? (
                "Endereço Fora de Área"
              ) : isChangeInvalid ? (
                "Valor do Troco Inválido" 
              ) : isBelowMinimumOrder ? (
                "Pedido abaixo do mínimo"
              ) : mercadoPagoCheckout ? (
                "Finalize no Mercado Pago"
              ) : paymentMethod === 'mercadopago' ? (
                "Confirmar e abrir Mercado Pago"
              ) : (
                "Confirmar e Enviar Pedido"
              )}
            </button>
          </div>
        </form>

        <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit space-y-6">
          <CheckoutSummary 
            cart={cart} deliveryFee={isPickup ? 0 : deliveryFee} discountValue={discountValue}
            appliedCoupon={activeCoupon}
            isSubmitting={isSubmitting} isStoreOpen={catalog?.is_open !== false} formatCurrency={formatCurrency}
            isDeliveryBlocked={isDeliveryBlocked}
            inactiveCartItems={inactiveCartItems}
            removeFromCart={removeFromCart}
            onAddToCart={handleAddToCart}
            onSubtractFromCart={handleSubtractFromCart}
            isChangeInvalid={isChangeInvalid}
            isPaymentReady={Boolean(paymentMethod && paymentConfig)}
            minimumOrder={minimumOrder}
            paymentMethod={paymentMethod}
            mercadoPagoCheckoutReady={Boolean(mercadoPagoCheckout)}
          />
        </div>
      </div>
      <PrivacyFooter />
    </div>
  );
}
