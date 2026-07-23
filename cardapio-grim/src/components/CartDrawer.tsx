import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartItem, Theme } from '../types/index.tsx';

interface CartDrawerProps {
  cart: CartItem[];
  theme: Theme;
  companySlug: string;
  deliveryFee: number;
  isPickup: boolean;
}

const CartDrawer = ({ cart, theme, companySlug, deliveryFee, isPickup }: CartDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Estados para o Cupom
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // 1. Cálculos de Carrinho e Taxas
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // 🛡️ Segurança: Garante que o preço seja formatado corretamente
  const subTotalValue = cart.reduce((sum, item) => {
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
    const validPrice = isNaN(itemPrice) ? 0 : itemPrice;
    return sum + validPrice * item.quantity;
  }, 0);

  const serviceFee = 0.00;  // Isento

  // Desconto de 10% aplicado apenas sobre o SUBTOTAL (taxas não entram no desconto)
  const discountValue = appliedCoupon ? subTotalValue * 0.10 : 0; 
  
  // Se for retirada, a taxa de entrega é sempre 0 no cálculo final
  const effectiveDeliveryFee = isPickup ? 0 : deliveryFee;

  // Matemática Final: Subtotal + Entrega + Serviço - Desconto
  const totalValue = subTotalValue + effectiveDeliveryFee + serviceFee - discountValue;

  // Formatadores de Moeda e Texto
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formattedSubTotal = formatCurrency(subTotalValue);
  
  // Correção aplicada: Se for pickup, mostra 'Retirada na Loja'. Senão, avalia se é maior que 0 ou Grátis.
  const formattedDelivery = isPickup 
    ? 'Retirada na Loja' 
    : (deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis');

  const formattedService = serviceFee > 0 ? formatCurrency(serviceFee) : 'Isento';
  const formattedDiscount = formatCurrency(discountValue);
  const formattedTotal = formatCurrency(totalValue);

  // 2. Funções de Ação
  const handleApplyCoupon = () => {
    if (couponCode.trim().length > 0) {
      setAppliedCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCheckout = () => {
    navigate(`/${companySlug}/checkout`, { 
      state: { 
        cart, 
        subTotal: subTotalValue, 
        deliveryFee: effectiveDeliveryFee,
        serviceFee,
        discount: discountValue, 
        total: totalValue, 
        coupon: appliedCoupon,
        isPickup 
      } 
    });
  };

  // 3. Renderização Condicional
  if (totalItems === 0) return null;

  const primaryColor = (theme as any).primary || '#27272a';

  return (
    <>
      {/* BOTÃO FLUTUANTE (BARRA ESTILO iFOOD) */}
      <div className="fixed bottom-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: primaryColor }}
          className="pointer-events-auto w-full max-w-md flex items-center justify-between px-5 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] text-white transition-all active:scale-95 hover:-translate-y-1"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
              <span className="text-base">🛒</span>
              <span>{totalItems}</span>
            </div>
            <span className="font-semibold text-sm sm:text-base">Ver pedido</span>
          </div>
          <span className="font-bold text-base sm:text-lg tracking-wide">{formattedTotal}</span>
        </button>
      </div>

      {/* OVERLAY + GAVETA */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-2xl" style={{ color: primaryColor }}>🛍️</span>
                Seu pedido
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                aria-label="Fechar carrinho"
              >
                ✕
              </button>
            </div>

            {/* Lista de Itens & Cupons (Scroll) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50">
              
              {/* Produtos */}
              <div className="space-y-4">
                {cart.map((item) => {
                  const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
                  const validPrice = isNaN(itemPrice) ? 0 : itemPrice;
                  const itemTotal = validPrice * item.quantity;

                  return (
                    <div key={item.id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm border border-gray-100/80">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                          <span className="font-bold" style={{ color: primaryColor }}>
                            {item.quantity}x
                          </span>
                          <span className="font-medium text-gray-800 line-clamp-2">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 whitespace-nowrap">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>
                      
                      {item.quantity > 1 && (
                        <div className="text-xs text-gray-400 text-right">
                          {formatCurrency(validPrice)} cada
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ÁREA DE CUPOM */}
              <div className="pt-4 border-t border-gray-200/60">
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Cupons</h3>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-2xl transition-all animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg">
                        🏷️
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-800">{appliedCoupon}</p>
                        <p className="text-xs font-medium text-green-600">Cupom aplicado com sucesso!</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-gray-400 hover:text-red-500 font-bold p-2 transition-colors"
                      aria-label="Remover cupom"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm"
                      style={{ '--tw-ring-color': primaryColor } as any}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponCode.trim().length === 0}
                      style={{ backgroundColor: couponCode.trim().length > 0 ? primaryColor : '#e5e7eb', color: couponCode.trim().length > 0 ? '#fff' : '#9ca3af' }}
                      className="px-5 font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 disabled:active:scale-100 disabled:shadow-none"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Rodapé - EXTRATO COMPLETO DA CONTA */}
            <div className="border-t border-gray-200 bg-white p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] shrink-0 z-10">
              
              <div className="space-y-3 mb-5">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-800 font-medium">{formattedSubTotal}</span>
                </div>

                {/* Taxa de Entrega / Retirada em Roxo se for pickup */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Taxa de entrega</span>
                  <span className={isPickup ? "text-purple-700 font-bold" : (deliveryFee > 0 ? "text-gray-800 font-medium" : "text-green-600 font-bold")}>
                    {formattedDelivery}
                  </span>
                </div>

                {/* Taxa de Serviço */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    Taxa de serviço
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">Info</span>
                  </span>
                  <span className={serviceFee > 0 ? "text-gray-800 font-medium" : "text-green-600 font-bold"}>
                    {formattedService}
                  </span>
                </div>

                {/* Desconto do Cupom */}
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-bold flex items-center gap-1">
                      Desconto
                    </span>
                    <span className="text-green-600 font-bold">-{formattedDiscount}</span>
                  </div>
                )}
                
                {/* Linha Divisória */}
                <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center mt-2">
                  <span className="text-gray-800 font-bold text-lg">Total a pagar</span>
                  <span className="text-2xl font-extrabold text-gray-900">
                    {formattedTotal}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                style={{ backgroundColor: primaryColor }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] transition-all active:scale-95 hover:opacity-90 hover:shadow-xl"
              >
                Finalizar pedido
                <span>➔</span>
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
};

export default CartDrawer;