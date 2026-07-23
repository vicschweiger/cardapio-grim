import { useState, useContext, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Store, Loader2 } from 'lucide-react';

import { CatalogContext } from '../context/CatalogContext.tsx';
import { CheckoutHeader } from '../components/checkout/CheckoutHeader.tsx';
import { CheckoutEmptyState } from '../components/checkout/CheckoutEmptyState.tsx';
import { CheckoutSuccessState } from '../components/checkout/CheckoutSuccessState.tsx';
import { CheckoutCustomerForm } from '../components/checkout/CheckoutCustomerForm.tsx';
import { CheckoutDeliveryForm } from '../components/checkout/CheckoutDeliveryForm.tsx';
import { CheckoutPaymentForm } from '../components/checkout/CheckoutPaymentForm.tsx';
import { CheckoutSummary } from '../components/checkout/CheckoutSummary.tsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api';

export default function CheckoutPage() {
  const { company_slug } = useParams<{ company_slug: string }>();
  const location = useLocation();
  
  const context = useContext(CatalogContext);
  if (!context) throw new Error("CheckoutPage deve ser renderizada dentro de um CatalogProvider");

  const { catalog, cart, clearCart, fetchCatalog } = context;

  const cartState = location.state as { subTotal: number, deliveryFee: number, discount: number, total: number, coupon: string | null } | null;

  // Estados: Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Estados: Logística (AGORA COM OS CAMPOS FRAGMENTADOS DO CEP)
  const [isPickup, setIsPickup] = useState(false);
  const [deliveryCep, setDeliveryCep] = useState('');
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [deliveryComplement, setDeliveryComplement] = useState('');
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  
  // Estados: Pagamento & Cupons
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | 'pix' | 'mercadopago'>('money');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [changeForStr, setChangeForStr] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(cartState?.coupon || null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState<number | null>(null);

  // Cálculos Financeiros
  const subtotal = useMemo(() => cart.reduce((acc, item) => {
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
    return acc + ((isNaN(itemPrice) ? 0 : itemPrice) * item.quantity);
  }, 0), [cart]);

  const deliveryFee = useMemo(() => isPickup ? 0 : (catalog?.delivery_fee ? Number(catalog.delivery_fee) : 4.90), [isPickup, catalog?.delivery_fee]);
  const serviceFee = 0.00; 

  const discountValue = useMemo(() => appliedCoupon ? subtotal * 0.10 : (cartState?.discount || 0), [appliedCoupon, subtotal, cartState?.discount]);
  const totalAmount = useMemo(() => Math.max(0, subtotal + deliveryFee + serviceFee - discountValue), [subtotal, deliveryFee, serviceFee, discountValue]);

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

    try {
      setIsSubmitting(true);

      // Verificação em Tempo Real no DB
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

      // Monta a payload enviando todos os dados fragmentados do endereço
      const response = await fetch(`${API_BASE_URL}/orders/${company_slug}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          is_pickup: isPickup,
          
          // Novos campos de endereço:
          delivery_cep: isPickup ? "" : deliveryCep,
          delivery_street: isPickup ? "" : deliveryStreet,
          delivery_number: isPickup ? "" : deliveryNumber,
          delivery_complement: isPickup ? "" : deliveryComplement,
          delivery_neighborhood: isPickup ? "" : deliveryNeighborhood,
          delivery_city: isPickup ? "" : deliveryCity,
          delivery_state: isPickup ? "" : deliveryState,
          delivery_address: isPickup ? "Retirada no Balcão" : "", // Deixa vazio, o backend formata sozinho!
          delivery_instructions: deliveryInstructions,
          
          items: formattedItems,
          subtotal, 
          delivery_fee: deliveryFee, 
          service_fee: serviceFee, 
          total_amount: totalAmount,
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
        <form onSubmit={handlePlaceOrder} id="checkout-form" className="lg:col-span-7 space-y-6">
          
          {catalog && !catalog.is_open && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 items-start animate-fade-in-up">
              <Store className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Estabelecimento Fechado</h4>
                <p className="text-xs mt-1">Você não pode finalizar o pedido neste momento pois a loja encontra-se fechada. Tente novamente mais tarde.</p>
              </div>
            </div>
          )}

          <CheckoutCustomerForm 
            customerName={customerName} 
            setCustomerName={setCustomerName} 
            customerPhone={customerPhone} 
            setCustomerPhone={setCustomerPhone} 
          />
          
          <CheckoutDeliveryForm 
            isPickup={isPickup} 
            setIsPickup={setIsPickup} 
            
            // Passando os novos estados do endereço para o componente
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
          />
          
          <CheckoutPaymentForm 
            paymentMethod={paymentMethod} 
            setPaymentMethod={setPaymentMethod} 
            cardType={cardType} 
            setCardType={setCardType} 
            changeForStr={changeForStr} 
            handleChangeForInput={handleChangeForInput} 
          />

          <div className="lg:hidden">
            <button type="submit" disabled={isSubmitting || catalog?.is_open === false} className="w-full bg-teal-600 text-white rounded-xl py-3.5 font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-lg flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar e Enviar Pedido"}
            </button>
          </div>
        </form>

        <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
          <CheckoutSummary 
            cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} discountValue={discountValue} totalAmount={totalAmount}
            appliedCoupon={appliedCoupon} couponCodeInput={couponCodeInput} setCouponCodeInput={setCouponCodeInput}
            handleApplyCheckoutCoupon={handleApplyCheckoutCoupon} handleRemoveCheckoutCoupon={handleRemoveCheckoutCoupon}
            isSubmitting={isSubmitting} isStoreOpen={catalog?.is_open !== false} formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
}