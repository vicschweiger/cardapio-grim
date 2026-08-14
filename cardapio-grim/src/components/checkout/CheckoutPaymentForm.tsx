import { CreditCard, DollarSign, Coins, Loader2, RotateCw, WalletCards, Check } from 'lucide-react';
import type { CardType, MercadoPagoCheckoutResponse, PaymentConfig, PaymentMethod } from '../../types/checkout';
import { MercadoPagoWallet } from './MercadoPagoWallet';

interface CheckoutPaymentFormProps {
  paymentMethod: PaymentMethod | null;
  setPaymentMethod: (value: PaymentMethod) => void;
  cardType: CardType;
  setCardType: (value: CardType) => void;
  changeForStr: string;
  handleChangeForInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  totalAmount: number;
  paymentConfig: PaymentConfig | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  mercadoPagoCheckout: MercadoPagoCheckoutResponse | null;
  isSubmitting: boolean;
}

const optionClass = (selected: boolean, accent = 'teal') =>
  `flex min-h-14 items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
    selected
      ? accent === 'blue'
        ? 'border-blue-500 bg-blue-50/30 text-blue-900 font-bold'
        : 'border-teal-500 bg-teal-50/20 text-teal-900 font-bold'
      : 'border-gray-200 hover:bg-gray-50'
  }`;

export function CheckoutPaymentForm({
  paymentMethod,
  setPaymentMethod,
  cardType,
  setCardType,
  changeForStr,
  handleChangeForInput,
  totalAmount,
  paymentConfig,
  isLoading,
  error,
  onRetry,
  mercadoPagoCheckout,
  isSubmitting,
}: CheckoutPaymentFormProps) {
  const changeForNumber = changeForStr ? parseFloat(changeForStr.replace(/\./g, '').replace(',', '.')) : 0;
  const isChangeError = changeForStr.length > 0 && changeForNumber < totalAmount;
  const moneyEnabled = paymentConfig?.money?.enabled !== false;
  const cardEnabled = paymentConfig?.card_on_delivery?.enabled !== false;
  const pixEnabled = paymentConfig?.pix.enabled === true;
  const mercadoPagoEnabled = paymentConfig?.mercadopago.enabled === true
    && paymentConfig.mercadopago.connected === true
    && (paymentConfig.mercadopago.pix_enabled || paymentConfig.mercadopago.card_enabled);
  const paymentLocked = Boolean(mercadoPagoCheckout);

  return (
    <div id="checkout-payment-section" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4 scroll-mt-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-teal-600" /> Forma de pagamento
      </h3>

      {isLoading && (
        <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-gray-500" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando formas de pagamento...
        </div>
      )}

      {!isLoading && error && (
        <div className={`rounded-xl border p-4 text-sm ${paymentConfig ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-700'}`} role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 font-bold">
            <RotateCw className="h-4 w-4" /> Tentar novamente
          </button>
        </div>
      )}

      {!isLoading && paymentConfig && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pixEnabled && (
            <label className={optionClass(paymentMethod === 'pix_manual')}>
              <input type="radio" name="payment_method_group" checked={paymentMethod === 'pix_manual'} onChange={() => setPaymentMethod('pix_manual')} disabled={paymentLocked} className="sr-only" />
              <Coins className="w-5 h-5 text-teal-600" /> PIX
            </label>
          )}

          {mercadoPagoEnabled && (
            <label className={optionClass(paymentMethod === 'mercadopago', 'blue')}>
              <input type="radio" name="payment_method_group" checked={paymentMethod === 'mercadopago'} onChange={() => setPaymentMethod('mercadopago')} disabled={paymentLocked} className="sr-only" />
              <WalletCards className="w-5 h-5 text-blue-500" /> Mercado Pago
            </label>
          )}

          {moneyEnabled && (
            <label className={optionClass(paymentMethod === 'money')}>
              <input type="radio" name="payment_method_group" checked={paymentMethod === 'money'} onChange={() => setPaymentMethod('money')} disabled={paymentLocked} className="sr-only" />
              <DollarSign className="w-5 h-5 text-gray-500" /> Dinheiro na entrega
            </label>
          )}

          {cardEnabled && (
            <label className={optionClass(paymentMethod === 'card')}>
              <input type="radio" name="payment_method_group" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} disabled={paymentLocked} className="sr-only" />
              <CreditCard className="w-5 h-5 text-gray-500" /> Cartão na entrega
            </label>
          )}
        </div>
      )}

      {!isLoading && paymentConfig && !moneyEnabled && !cardEnabled && !pixEnabled && !mercadoPagoEnabled && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="alert">
          Nenhuma forma de pagamento está disponível no momento.
        </p>
      )}

      {paymentMethod === 'card' && (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 animate-fade-in-up">
          <span className="text-xs font-bold text-gray-600 uppercase">Tipo de cartão:</span>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            {(['credit', 'debit'] as const).map(type => (
              <button key={type} type="button" onClick={() => setCardType(type)} className={`px-4 py-2 rounded-lg text-xs font-bold border ${cardType === type ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {type === 'credit' ? 'Crédito' : 'Débito'}
              </button>
            ))}
          </div>
        </div>
      )}

      {paymentMethod === 'mercadopago' && mercadoPagoEnabled && (
        mercadoPagoCheckout ? (
          <MercadoPagoWallet
            initPoint={mercadoPagoCheckout.init_point}
          />
        ) : (
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 animate-fade-in-up">
            <p className="text-sm font-bold text-blue-950">Pague com Mercado Pago</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-blue-900">
              {paymentConfig?.mercadopago.pix_enabled && <p className="flex items-center gap-2 rounded-lg bg-white p-3"><Check className="h-4 w-4 text-blue-600" /> PIX</p>}
              {paymentConfig?.mercadopago.card_enabled && <p className="flex items-center gap-2 rounded-lg bg-white p-3"><Check className="h-4 w-4 text-blue-600" /> Cartão de crédito ou débito</p>}
            </div>
            <p className="mt-3 text-xs text-blue-800">O pagamento será feito diretamente ao lojista no ambiente seguro do Mercado Pago.</p>
            <button type="submit" disabled={isSubmitting} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparando pagamento...</> : 'Pagar com Mercado Pago'}
            </button>
          </div>
        )
      )}

      {paymentMethod === 'money' && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3 animate-fade-in-up">
          <label htmlFor="change-for" className="block text-xs font-semibold text-gray-600">Troco para quanto? (R$)</label>
          <input id="change-for" inputMode="decimal" type="text" placeholder={`Ex: ${Math.ceil(totalAmount + 10)},00`} value={changeForStr} onChange={handleChangeForInput} className={`w-full rounded-lg border p-2.5 text-base sm:text-sm outline-none bg-white ${isChangeError ? 'border-red-400 text-red-700' : 'border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'}`} />
          {isChangeError && <span className="text-xs font-bold text-red-500">O valor deve ser maior ou igual ao total do pedido.</span>}
        </div>
      )}
    </div>
  );
}
