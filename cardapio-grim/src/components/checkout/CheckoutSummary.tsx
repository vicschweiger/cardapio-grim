import { ShoppingBag, Tag, Loader2 } from 'lucide-react';

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
  // NOVA PROP ADICIONADA AQUI:
  isDeliveryBlocked: boolean;
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
  isDeliveryBlocked // <--- Recebendo a prop aqui
}: CheckoutSummaryProps) {
  return (
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

      <div className="pt-2 border-t border-gray-100 hidden">
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
            <input type="text" placeholder="Digite seu cupom..." value={couponCodeInput} onChange={e => setCouponCodeInput(e.target.value.toUpperCase())} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs uppercase outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
            <button type="button" onClick={handleApplyCheckoutCoupon} disabled={!couponCodeInput.trim()} className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-800 disabled:opacity-50 transition-colors">
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
        {/* O BOTÃO AGORA BLOQUEIA SE A ESTIVER FORA DA ÁREA (isDeliveryBlocked) */}
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
      </div>
    </div>
  );
}