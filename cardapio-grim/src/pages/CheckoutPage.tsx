import { useState, useContext, useMemo, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Store, Loader2, AlertCircle } from 'lucide-react';

import { CatalogContext } from '../context/CatalogContext.tsx';
import { CheckoutHeader } from '../components/checkout/CheckoutHeader.tsx';
import { CheckoutEmptyState } from '../components/checkout/CheckoutEmptyState.tsx';
import { CheckoutSuccessState } from '../components/checkout/CheckoutSuccessState.tsx';
import { CheckoutCustomerForm } from '../components/checkout/CheckoutCustomerForm.tsx';
import { CheckoutDeliveryForm } from '../components/checkout/CheckoutDeliveryForm.tsx';
import { CheckoutPaymentForm } from '../components/checkout/CheckoutPaymentForm.tsx';
import { CheckoutSummary } from '../components/checkout/CheckoutSummary.tsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api';

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
  
  const context = useContext(CatalogContext);
  if (!context) throw new Error("CheckoutPage deve ser renderizada dentro de um CatalogProvider");

  const { catalog, cart, clearCart, fetchCatalog, removeFromCart } = context;

  // 🛡️ INICIALIZAÇÃO BLINDADA (Ignora cache velho ou corrompido)
  const [initialData] = useState(() => {
    const navState = location.state as any;
    
    let name = navState?.customerName || '';
    let phone = navState?.customerPhone || '';
    let pickup = navState?.isPickup || false;
    let fee = navState?.deliveryFee || 0;
    
    // 1. Tenta pegar o endereço vindo do Carrinho
    let address = navState?.customerAddressInfo;

    try {
      const stored = sessionStorage.getItem(`deliveryInfo_${company_slug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 2. CORREÇÃO DO BUG: Se não veio endereço do carrinho, tenta pegar da sessão.
        // Mas SÓ ACEITA se for um OBJETO (ignora strings de caches velhos)
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

    // 3. Garantia absoluta: Se address for string ou null, vira objeto vazio para não quebrar o formulário
    if (typeof address !== 'object' || address === null) {
      address = {};
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

  // ESTADOS DOS FORMULÁRIOS - Agora inicializam perfeitamente lendo o objeto `address`
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
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | 'pix' | 'mercadopago'>('money');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [changeForStr, setChangeForStr] = useState('');
  
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(initialData.coupon);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState<number | null>(null);

  // ESTADOS DO FRETE E BLOQUEIO
  const [deliveryFee, setDeliveryFee] = useState(initialData.fee);
  const [isDeliveryBlocked, setDeliveryBlocked] = useState(!(initialData.fee > 0 || initialData.pickup));

  // 🔴 CÁLCULO INTELIGENTE DE PRODUTOS INATIVOS (EM TEMPO REAL)
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

  const serviceFee = 0; 
  const discountValue = useMemo(() => appliedCoupon ? subtotal * 0.10 : initialData.discount, [appliedCoupon, subtotal, initialData.discount]);
  const totalAmount = useMemo(() => Math.max(0, subtotal + (isPickup ? 0 : deliveryFee) + serviceFee - discountValue), [subtotal, deliveryFee, isPickup, serviceFee, discountValue]);

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

  const handleApplyCheckoutCoupon = () => {
    if (couponCodeInput.trim().length > 0) {
      setAppliedCoupon(couponCodeInput.trim().toUpperCase());
      setCouponCodeInput('');
    }
  };

  const handleRemoveCheckoutCoupon = () => {
    setAppliedCoupon(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !catalog) return;

    if (!catalog.is_open) return alert("O estabelecimento encontra-se fechado. Não é possível enviar pedidos.");
    if (customerPhone.replace(/\D/g, '').length < 10) return alert("Por favor, insira um número de celular válido.");
    if (!isPickup && isDeliveryBlocked) return alert("Por favor, verifique o seu endereço. A entrega não está disponível para esta localização.");
    if (inactiveCartItems.length > 0) return alert("Por favor, remova os itens indisponíveis do carrinho antes de finalizar o pedido.");

    try {
      setIsSubmitting(true);

      try {
        const checkStatusRes = await fetch(`${API_BASE_URL}/catalog/${company_slug}/`);
        if (checkStatusRes.ok) {
          const checkStatusData = await checkStatusRes.json();
          if (!checkStatusData.is_open) {
             alert("⚠️ O estabelecimento acabou de fechar! Não é possível enviar o pedido neste momento.");
             if (fetchCatalog) fetchCatalog(company_slug!, true);
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

      let finalPaymentMethod = paymentMethod === 'card' ? (cardType === 'credit' ? 'card_credit' : 'card_debit') : paymentMethod;

      const fullDeliveryAddress = isPickup 
        ? "Retirada no Balcão" 
        : `${deliveryStreet}, ${deliveryNumber}${deliveryComplement ? ` - ${deliveryComplement}` : ''} • ${deliveryNeighborhood} • ${deliveryCity}/${deliveryState} (CEP: ${deliveryCep})`;

      const response = await fetch(`${API_BASE_URL}/orders/${company_slug}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          items: formattedItems,
          subtotal, delivery_fee: isPickup ? 0 : deliveryFee, service_fee: serviceFee, total_amount: totalAmount,
          payment_method: finalPaymentMethod,
          change_for: paymentMethod === 'money' && changeForStr ? getChangeForAsNumber() : null,
          is_paid: paymentMethod === 'pix' || paymentMethod === 'mercadopago',
          status: "new",
          coupon_applied: appliedCoupon
        })
      });

      if (response.ok) {
        const result = await response.json();
        setOrderCreatedId(result.order_id);
        clearCart(); 
      } else {
        const errData = await response.json();
        alert(`Erro: ${errData.error || response.statusText}`);
        if (response.status === 403 && fetchCatalog) fetchCatalog(company_slug!, true);
      }
    } catch (error) {
      alert("Erro de conexão ao enviar o pedido para a cozinha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

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
          
          <CheckoutPaymentForm paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} cardType={cardType} setCardType={setCardType} changeForStr={changeForStr} handleChangeForInput={handleChangeForInput} />

          <div className="lg:hidden">
            <button 
              type="submit" 
              disabled={isSubmitting || catalog?.is_open === false || (!isPickup && isDeliveryBlocked) || inactiveCartItems.length > 0} 
              className="w-full bg-teal-600 text-white rounded-xl py-3.5 font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : inactiveCartItems.length > 0 ? (
                "Remova itens indisponíveis"
              ) : (!isPickup && isDeliveryBlocked) ? (
                "Endereço Fora de Área"
              ) : (
                "Confirmar e Enviar Pedido"
              )}
            </button>
          </div>
        </form>

        <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit space-y-6">
          <CheckoutSummary 
            cart={cart} subtotal={subtotal} deliveryFee={isPickup ? 0 : deliveryFee} discountValue={discountValue} totalAmount={totalAmount}
            appliedCoupon={appliedCoupon} couponCodeInput={couponCodeInput} setCouponCodeInput={setCouponCodeInput}
            handleApplyCheckoutCoupon={handleApplyCheckoutCoupon} handleRemoveCheckoutCoupon={handleRemoveCheckoutCoupon}
            isSubmitting={isSubmitting} isStoreOpen={catalog?.is_open !== false} formatCurrency={formatCurrency}
            isPickup={isPickup} isDeliveryBlocked={isDeliveryBlocked}
            inactiveCartItems={inactiveCartItems}
            removeFromCart={removeFromCart}
          />
        </div>
      </div>
    </div>
  );
}