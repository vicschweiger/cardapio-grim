import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, Undo2, AlertTriangle } from 'lucide-react';
import type { CartItem } from '../../types/index.tsx';
import type { AppliedCoupon } from '../../types/checkout.ts';
import { QuantityStepper } from '../QuantityStepper.tsx';

interface CheckoutSummaryProps {
  cart: CartItem[];
  deliveryFee: number;
  discountValue: number;
  appliedCoupon: AppliedCoupon | null;
  isSubmitting: boolean;
  isStoreOpen: boolean;
  formatCurrency: (val: number) => string;
  isDeliveryBlocked: boolean;
  inactiveCartItems?: string[];
  removeFromCart: (itemName: string) => void;
  onAddToCart: (item: CartItem) => void;
  onSubtractFromCart: (productId: string | number) => void;
  isChangeInvalid?: boolean; // <--- NOVA PROP ADICIONADA AQUI
  isPaymentReady?: boolean;
  minimumOrder: number;
  paymentMethod?: string | null;
  mercadoPagoCheckoutReady?: boolean;
}

export function CheckoutSummary({ 
  cart, 
  deliveryFee, 
  discountValue, 
  appliedCoupon, 
  isSubmitting, 
  isStoreOpen, 
  formatCurrency,
  isDeliveryBlocked,
  inactiveCartItems = [],
  removeFromCart,
  onAddToCart,
  onSubtractFromCart,
  isChangeInvalid = false, // <--- ADICIONADO AQUI
  isPaymentReady = true,
  minimumOrder,
  paymentMethod,
  mercadoPagoCheckoutReady = false,
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

  const activeDiscount = Math.max(0, discountValue);
  const activeTotal = Math.max(0, activeSubtotal + deliveryFee - activeDiscount);
  const activeOrderValueWithoutDelivery = Math.max(0, activeSubtotal - activeDiscount);
  const isBelowMinimum = minimumOrder > 0 && activeOrderValueWithoutDelivery < minimumOrder;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-gray-100 pb-3">
        <ShoppingBag className="w-4 h-4 text-teal-600" /> Resumo do Carrinho
      </h3>
      
      <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto custom-scrollbar pr-1">
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
            <div key={idx} className={`py-3 space-y-2.5 text-sm transition-colors ${isItemInactive ? 'bg-amber-50/50 px-2 rounded-lg -mx-2' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <span className={`font-medium min-w-0 flex-1 ${isItemInactive ? 'text-amber-800 line-through opacity-70' : 'text-gray-700'}`}>
                  {item.name}
                </span>
                <span className={`font-semibold whitespace-nowrap ${isItemInactive ? 'text-amber-800 opacity-50 line-through' : 'text-gray-900'}`}>
                  {formatCurrency(validPrice * item.quantity)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <QuantityStepper
                  quantity={item.quantity}
                  itemName={item.name}
                  onIncrement={() => onAddToCart(item)}
                  onDecrement={() => item.quantity === 1 ? handleIntentionToRemove(item.name) : onSubtractFromCart(item.id)}
                  disabled={isSubmitting || mercadoPagoCheckoutReady}
                  incrementDisabled={isItemInactive}
                  compact
                />
                <span className="text-xs text-gray-400">{formatCurrency(validPrice)} cada</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
        {minimumOrder > 0 && (
          <div className={`flex justify-between rounded-lg px-3 py-2 font-semibold ${isBelowMinimum ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-700'}`}>
            <span>Pedido mínimo:</span>
            <span>{formatCurrency(minimumOrder)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-medium text-gray-900">{formatCurrency(activeSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxa de Entrega:</span>
          {appliedCoupon?.discount_type === 'free_shipping' && deliveryFee > 0 ? (
            <span className="flex items-center gap-2 font-bold text-green-600">
              <span className="text-gray-400 line-through">{formatCurrency(deliveryFee)}</span>
              Frete Grátis
            </span>
          ) : (
            <span className={`font-semibold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {deliveryFee === 0 ? "Grátis / Balcão" : formatCurrency(deliveryFee)}
            </span>
          )}
        </div>
        {activeDiscount > 0 && (
            <div className="flex justify-between text-green-600 font-bold">
              <span>Desconto aplicado:</span>
              <span>- {formatCurrency(activeDiscount)}</span>
            </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900 text-base">
          <span>Total Final:</span>
          <span className="text-teal-600 text-lg">{formatCurrency(activeTotal)}</span>
        </div>
      </div>

      {isBelowMinimum && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900" role="alert">
          Faltam {formatCurrency(Math.max(0, minimumOrder - activeOrderValueWithoutDelivery))} em produtos para atingir o pedido mínimo. A entrega não entra nesse cálculo.
        </p>
      )}
      
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
            disabled={isSubmitting || !isStoreOpen || isDeliveryBlocked || isChangeInvalid || !isPaymentReady || isBelowMinimum || mercadoPagoCheckoutReady}
            className="w-full bg-teal-600 text-white rounded-xl py-3.5 font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isDeliveryBlocked ? (
              "Endereço Fora da Área de Entrega"
            ) : isChangeInvalid ? (
              "Valor do Troco Inválido" // <--- MENSAGEM DINÂMICA
            ) : isBelowMinimum ? (
              "Pedido abaixo do mínimo"
            ) : mercadoPagoCheckoutReady ? (
              "Finalize no Mercado Pago"
            ) : paymentMethod === 'mercadopago' ? (
              "Confirmar e abrir Mercado Pago"
            ) : (
              "Confirmar e Enviar Pedido"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
