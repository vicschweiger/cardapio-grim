import { useState, useContext, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingBag, 
  MapPin, 
  User, 
  CreditCard, 
  DollarSign, 
  Coins, 
  Truck, 
  Store, 
  Loader2,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { CatalogContext } from '../context/CatalogContext.tsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api';

export default function CheckoutPage() {
  const { company_slug } = useParams<{ company_slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("CheckoutPage deve ser renderizada dentro de um CatalogProvider");
  }

  const { catalog, cart, clearCart, fetchCatalog } = context;

  const cartState = location.state as { 
    subTotal: number, deliveryFee: number, serviceFee: number, 
    discount: number, total: number, coupon: string | null 
  } | null;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isPickup, setIsPickup] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | 'pix' | 'mercadopago'>('money');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  
  const [changeForStr, setChangeForStr] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(cartState?.coupon || null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState<number | null>(null);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
      const validPrice = isNaN(itemPrice) ? 0 : itemPrice;
      return acc + (validPrice * item.quantity);
    }, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (isPickup) return 0;
    return catalog?.delivery_fee ? Number(catalog.delivery_fee) : 4.90;
  }, [isPickup, catalog?.delivery_fee]);

  const serviceFee = 0.00; 

  const discountValue = useMemo(() => {
    if (appliedCoupon) {
      return subtotal * 0.10;
    }
    return cartState?.discount || 0;
  }, [appliedCoupon, subtotal, cartState?.discount]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal + deliveryFee + serviceFee - discountValue);
  }, [subtotal, deliveryFee, serviceFee, discountValue]);

  const logoUrl = catalog?.logo_url;
  const name = catalog?.name || '';

  const getChangeForAsNumber = () => {
    if (!changeForStr) return 0;
    const cleanStr = changeForStr.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleanStr);
    return isNaN(val) ? 0 : val;
  };

  const handleChangeForInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); 
    if (!value) {
      setChangeForStr('');
      return;
    }
    const numberValue = (parseInt(value, 10) / 100).toFixed(2);
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(numberValue));
    
    setChangeForStr(formatted);
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

    // --- Validação Frontend Local ---
    if (!catalog.is_open) {
      alert("O estabelecimento encontra-se fechado no momento. Não é possível enviar pedidos.");
      return;
    }

    const phoneClean = customerPhone.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      alert("Por favor, insira um número de celular válido com DDD.");
      return;
    }

    try {
      setIsSubmitting(true);

      // =========================================================================
      // CHECAGEM EM TEMPO REAL (Mili-segundos antes de salvar no DB)
      // Vai direto no MongoDB verificar se a loja não fechou nos últimos segundos
      // =========================================================================
      try {
        const checkStatusRes = await fetch(`${API_BASE_URL}/catalog/${company_slug}/`);
        if (checkStatusRes.ok) {
          const checkStatusData = await checkStatusRes.json();
          if (!checkStatusData.is_open) {
             alert("⚠️ O estabelecimento acabou de fechar! Não é possível enviar o pedido neste momento.");
             // Força a atualização do Contexto Global para mostrar o aviso vermelho
             if (fetchCatalog) fetchCatalog(company_slug!, true);
             setIsSubmitting(false);
             return;
          }
        }
      } catch (checkErr) {
        console.warn("Erro ao fazer pre-flight check, prosseguindo para o POST...", checkErr);
      }
      // =========================================================================

      const formattedItems = cart.map(item => {
        const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
        return {
          produto: item.name,
          qtd: item.quantity,
          preco: isNaN(itemPrice) ? 0 : itemPrice,
          obs: (item as any).obs || ""
        };
      });

      let finalPaymentMethod = paymentMethod;
      if (paymentMethod === 'card') {
        finalPaymentMethod = cardType === 'credit' ? 'card_credit' : 'card_debit';
      }

      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        is_pickup: isPickup,
        delivery_address: isPickup ? "Retirada no Balcão" : deliveryAddress,
        delivery_instructions: deliveryInstructions,
        items: formattedItems,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        total_amount: totalAmount,
        payment_method: finalPaymentMethod,
        change_for: paymentMethod === 'money' && changeForStr ? getChangeForAsNumber() : null,
        is_paid: paymentMethod === 'pix' || paymentMethod === 'mercadopago',
        status: "new",
        coupon_applied: appliedCoupon
      };

      const response = await fetch(`${API_BASE_URL}/orders/${company_slug}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setOrderCreatedId(result.order_id);
        clearCart(); 
      } else {
        const errData = await response.json();
        // Caso o backend recuse (Erro 403 da view.py que valida loja fechada)
        if (response.status === 403) {
          alert(`⚠️ ${errData.error}`);
          if (fetchCatalog) fetchCatalog(company_slug!, true);
        } else {
          alert(`Erro ao processar pedido: ${errData.error || response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Erro na requisição de checkout:", error);
      alert("Erro de conexão ao enviar o pedido para a cozinha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (orderCreatedId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center space-y-6 animate-fade-in-up">
          <div className="inline-flex p-3 rounded-full bg-green-50 text-green-500">
            <CheckCircle2 className="w-16 h-16 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Pedido Recebido!</h2>
            <p className="text-sm text-gray-500">O seu pedido já foi enviado diretamente para a nossa cozinha e está sendo preparado.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm font-semibold text-gray-700">
            Senha do Pedido: <span className="text-teal-600 font-mono text-base">#{orderCreatedId.toString().slice(-6)}</span>
          </div>
          <button 
            onClick={() => navigate(`/${company_slug}`)}
            className="w-full bg-teal-600 text-white rounded-xl py-3 font-bold hover:bg-teal-700 shadow-md shadow-teal-600/10 transition-colors"
          >
            Voltar ao Cardápio
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">O seu carrinho está vazio</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">Adicione itens do menu antes de tentar finalizar a sua compra.</p>
        <Link to={`/${company_slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Cardápio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={`/${company_slug}`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {/* AVATAR / LOGO */}
          <div className="shrink-0 relative">
            {logoUrl ? (
              // Container com fundo branco e padding para a imagem respirar e não encostar nas bordas
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white flex items-center justify-center overflow-hidden p-1.5">
                <img
                  src={logoUrl}
                  alt={`Logo de ${name}`}
                  // object-contain garante que a imagem caiba inteira sem cortar, mantendo a proporção original
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              // Fallback elegante caso a empresa ainda não tenha logo
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200 shadow-sm">
                <span className="text-gray-400 text-3xl sm:text-4xl font-bold uppercase">
                  {name ? name.charAt(0) : ''}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Finalizar Pedido</h2>
            <p className="text-xs text-gray-500 capitalize">{catalog?.name}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <form onSubmit={handlePlaceOrder} id="checkout-form" className="lg:col-span-7 space-y-6">
          
          {/* AVISO VISUAL DE LOJA FECHADA */}
          {catalog && !catalog.is_open && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 items-start animate-fade-in-up">
              <Store className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Estabelecimento Fechado</h4>
                <p className="text-xs mt-1">Você não pode finalizar o pedido neste momento pois a loja encontra-se fechada. Tente novamente mais tarde.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" /> Seus Dados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nome Completo *</label>
                <input required type="text" placeholder="Como quer ser chamado..." value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">WhatsApp / Celular (Válido) *</label>
                <input required type="tel" placeholder="Ex: 11 99999-9999" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" /> Forma de Entrega
            </h3>
            
            <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl border border-gray-200/40">
              <button type="button" onClick={() => setIsPickup(false)} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${!isPickup ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}>
                <Truck className="w-4 h-4" /> Delivery
              </button>
              <button type="button" onClick={() => setIsPickup(true)} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${isPickup ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}>
                <Store className="w-4 h-4" /> Retirar no Balcão
              </button>
            </div>

            {!isPickup ? (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Endereço Completo de Entrega *</label>
                  <input required={!isPickup} type="text" placeholder="Rua, Número, Bairro, Cidade..." value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ponto de Referência / Complemento</label>
                  <input type="text" placeholder="Apto, bloco, portão cor verde, etc..." value={deliveryInstructions} onChange={e => setDeliveryInstructions(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-purple-50 text-purple-800 text-xs font-medium border border-purple-100 flex gap-2 items-start animate-fade-in-up">
                <Store className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Retirada Sem Taxas ativa!</p>
                  <p className="mt-0.5 opacity-90">Busque o seu pedido diretamente no balcão do estabelecimento assim que o status mudar para pronto.</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" /> Método de Pagamento
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition-all ${paymentMethod === 'money' ? 'border-teal-500 bg-teal-50/20 text-teal-900 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment_method_group" checked={paymentMethod === 'money'} onChange={() => setPaymentMethod('money')} className="hidden" />
                <DollarSign className="w-5 h-5 text-gray-500" /> Dinheiro
              </label>
              
              <label className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-teal-500 bg-teal-50/20 text-teal-900 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment_method_group" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="hidden" />
                <CreditCard className="w-5 h-5 text-gray-500" /> Cartão
              </label>

              <label className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition-all ${paymentMethod === 'pix' ? 'border-teal-500 bg-teal-50/20 text-teal-900 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment_method_group" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="hidden" />
                <Coins className="w-5 h-5 text-gray-500" /> PIX
              </label>
            </div>

            {paymentMethod === 'card' && (
              <div className="md:w-max p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-4 animate-fade-in-up">
                <span className="text-xs font-bold text-gray-600 uppercase">Tipo de Cartão:</span>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setCardType('credit')} 
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${cardType === 'credit' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    Crédito
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setCardType('debit')} 
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${cardType === 'debit' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    Débito
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'money' && (
              <div className="md:w-max p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-3 animate-fade-in-up">
                <label className="block text-xs font-semibold text-gray-600">Troco para quanto? (R$)</label>
                <input 
                  type="text" 
                  placeholder="Ex: 50,00" 
                  value={changeForStr} 
                  onChange={handleChangeForInput} 
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 bg-white" 
                />
              </div>
            )}
          </div>
          
          <div className="lg:hidden">
            <button type="submit" disabled={isSubmitting || catalog?.is_open === false} className="w-full bg-teal-600 text-white rounded-xl py-3.5 font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-lg flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar e Enviar Pedido"}
            </button>
          </div>
        </form>

        {/* COLUNA DIREITA: RESUMO E CUPOM DE DESCONTO */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 h-fit">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-gray-100 pb-3">
              <ShoppingBag className="w-4 h-4 text-teal-600" /> Resumo do Carrinho
            </h3>
            
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {cart.map((item, idx) => {
                const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
                const validPrice = isNaN(itemPrice) ? 0 : itemPrice;
                return (
                  <div key={idx} className="py-2.5 flex justify-between text-sm items-center gap-3">
                    <span className="text-gray-700 font-medium truncate flex-1">
                      <strong className="text-teal-600 mr-1">{item.quantity}x</strong> {item.name}
                    </span>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(validPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Cupom de Desconto</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-xl text-sm">
                  <div className="flex items-center gap-2 text-green-800 font-bold">
                    <Tag className="w-4 h-4 text-green-600" /> {appliedCoupon} (Aplicado)
                  </div>
                  <button type="button" onClick={handleRemoveCheckoutCoupon} className="text-xs text-red-500 font-bold hover:underline">
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Digite seu cupom..." 
                    value={couponCodeInput} 
                    onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs uppercase outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button 
                    type="button" 
                    onClick={handleApplyCheckoutCoupon}
                    disabled={!couponCodeInput.trim()}
                    className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-800 disabled:opacity-50 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Entrega:</span>
                <span className={`font-semibold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {deliveryFee === 0 ? "Grátis / Balcão" : formatCurrency(deliveryFee)}
                </span>
              </div>
              {discountValue > 0 && (
                 <div className="flex justify-between text-green-600 font-bold">
                   <span>Desconto aplicado:</span>
                   <span>-{formatCurrency(discountValue)}</span>
                 </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900 text-base">
                <span>Total Final:</span>
                <span className="text-teal-600 text-lg">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <button type="submit" form="checkout-form" disabled={isSubmitting || catalog?.is_open === false} className="w-full bg-teal-600 text-white rounded-xl py-3.5 font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar e Enviar Pedido"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}