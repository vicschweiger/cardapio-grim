import { useState, useEffect } from 'react';
import { ShoppingBag, Tag, Loader2, Trash2, Undo2, AlertTriangle } from 'lucide-react';

interface CheckoutSummaryProps {
  cart: any[];
  subtotal: number;
  deliveryFee: number;
  discountValue: number;
  totalAmount: number;
  appliedCoupon: string | null;
  couponCodeInput: string;
  setCouponCodeInput: (val: string) => void;
  handleApplyCheckoutCoupon: () => void;
  handleRemoveCheckoutCoupon: () => void;
  isSubmitting: boolean;
  isStoreOpen: boolean;
  formatCurrency: (val: number) => string;
  isDeliveryBlocked: boolean;
  inactiveCartItems?: string[];
  removeFromCart: (itemName: string) => void;
}

export function CheckoutSummary({ 
  cart, 
  subtotal, 
  deliveryFee, 
  discountValue, 
  totalAmount, 
  appliedCoupon, 
  couponCodeInput, 
  setCouponCodeInput, 
  handleApplyCheckoutCoupon, 
  handleRemoveCheckoutCoupon, 
  isSubmitting, 
  isStoreOpen, 
  formatCurrency,
  isDeliveryBlocked,
  inactiveCartItems = [],
  removeFromCart
}: CheckoutSummaryProps) {

  const [pendingRemoval, setPendingRemoval] = useState<string[]>([]);

  const handleIntentionToRemove = (itemName: string) => setPendingRemoval(prev => [...prev, itemName]);
  const handleUndoRemove = (itemName: string) => setPendingRemoval(prev => prev.filter(name => name !== itemName));

  useEffect(() => {
    if (pendingRemoval.length === 0) return;
    const timers = pendingRemoval.map(itemName => {
      return setTimeout(() => {
        setPendingRemoval(current => {
          if (current.includes(itemName)) {
            removeFromCart(itemName);
            return current.filter(name => name !== itemName);
          }
          return current;
        });
      }, 4000);
    });
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [pendingRemoval, removeFromCart]);

  // 🔴 RECÁLCULO INSTANTÂNEO (Ignora itens na "lixeira" temporária)
  const activeCart = cart.filter(item => !pendingRemoval.includes(item.name));
  
  const activeSubtotal = activeCart.reduce((sum, item) => {
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
    const validPrice = isNaN(itemPrice) ? 0 : itemPrice;
    return sum + validPrice * item.quantity;
  }, 0);

  // Ajusta o desconto para nunca ser maior que o subtotal ativo
  const activeDiscount = appliedCoupon ? activeSubtotal * 0.10 : Math.min(activeSubtotal, discountValue);
  const activeTotal = Math.max(0, activeSubtotal + deliveryFee - activeDiscount);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-gray-100 pb-3">
        <ShoppingBag className="w-4 h-4 text-teal-600" /> Resumo do Carrinho
      </h3>
      
      <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto custom-scrollbar pr-1">
        {cart.map((item, idx) => {
          const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
          const validPrice = isNaN(itemPrice) ? 0 : itemPrice;
          
          const isItemInactive = inactiveCartItems.includes(item.name);
          const isPendingRemoval = pendingRemoval.includes(item.name);

          if (isPendingRemoval) {
            return (
              <div key={idx} className="py-2.5 flex justify-between items-center gap-3 bg-red-50/50 rounded-lg px-2 my-1 animate-fade-in border border-red-100 border-dashed">
                <span className="text-xs text-red-600 font-medium">Item removido</span>
                <button 
                  type="button" 
                  onClick={() => handleUndoRemove(item.name)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                >
                  <Undo2 className="w-3 h-3" /> Desfazer
                </button>
              </div>
            );
          }

          return (
            <div key={idx} className={`py-2.5 flex justify-between text-sm items-center gap-3 group relative transition-colors ${isItemInactive ? 'bg-amber-50/50 px-2 rounded-lg -mx-2' : ''}`}>
              <span className={`font-medium truncate flex-1 ${isItemInactive ? 'text-amber-800 line-through opacity-70' : 'text-gray-700'}`}>
                <strong className={`${isItemInactive ? 'text-amber-700' : 'text-teal-600'} mr-1`}>{item.quantity}x</strong> {item.name}
              </span>
              
              <div className="flex items-center gap-3">
                <span className={`font-semibold whitespace-nowrap ${isItemInactive ? 'text-amber-800 opacity-50 line-through' : 'text-gray-900'}`}>
                  {formatCurrency(validPrice * item.quantity)}
                </span>
                
                <button 
                  type="button"
                  onClick={() => handleIntentionToRemove(item.name)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
                  aria-label="Remover item"
                  title="Remover item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-medium text-gray-900">{formatCurrency(activeSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxa de Entrega:</span>
          <span className={`font-semibold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {deliveryFee === 0 ? "Grátis / Balcão" : formatCurrency(deliveryFee)}
          </span>
        </div>
        {activeDiscount > 0 && (
            <div className="flex justify-between text-green-600 font-bold">
              <span>Desconto aplicado:</span>
              <span>-{formatCurrency(activeDiscount)}</span>
            </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900 text-base">
          <span>Total Final:</span>
          <span className="text-teal-600 text-lg">{formatCurrency(activeTotal)}</span>
        </div>
      </div>
      
      <div className="hidden lg:block">
        {inactiveCartItems.length > 0 ? (
          <button 
            type="button" 
            onClick={() => inactiveCartItems.forEach(item => removeFromCart(item))}
            className="w-full bg-amber-500 text-white rounded-xl py-3.5 font-bold hover:bg-amber-600 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer animate-fade-in"
          >
            <AlertTriangle className="w-4 h-4" />
            Remover Itens Indisponíveis
          </button>
        ) : (
          <button 
            type="submit" 
            form="checkout-form" 
            disabled={isSubmitting || !isStoreOpen || isDeliveryBlocked} 
            className="w-full bg-teal-600 text-white rounded-xl py-3.5 font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isDeliveryBlocked ? (
              "Endereço Fora da Área de Entrega"
            ) : (
              "Confirmar e Enviar Pedido"
            )}
          </button>
        )}
      </div>
    </div>
  );
}