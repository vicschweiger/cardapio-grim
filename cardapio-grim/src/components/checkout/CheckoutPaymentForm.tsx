import { CreditCard, DollarSign, Coins } from 'lucide-react';

interface CheckoutPaymentFormProps {
  paymentMethod: 'money' | 'card' | 'pix' | 'mercadopago';
  setPaymentMethod: (val: 'money' | 'card' | 'pix' | 'mercadopago') => void;
  cardType: 'credit' | 'debit';
  setCardType: (val: 'credit' | 'debit') => void;
  changeForStr: string;
  handleChangeForInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CheckoutPaymentForm({ paymentMethod, setPaymentMethod, cardType, setCardType, changeForStr, handleChangeForInput }: CheckoutPaymentFormProps) {
  return (
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
            <button type="button" onClick={() => setCardType('credit')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${cardType === 'credit' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
              Crédito
            </button>
            <button type="button" onClick={() => setCardType('debit')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${cardType === 'debit' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
              Débito
            </button>
          </div>
        </div>
      )}

      {paymentMethod === 'money' && (
        <div className="md:w-max p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-3 animate-fade-in-up">
          <label className="block text-xs font-semibold text-gray-600">Troco para quanto? (R$)</label>
          <input type="text" placeholder="Ex: 50,00" value={changeForStr} onChange={handleChangeForInput} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 bg-white" />
        </div>
      )}
    </div>
  );
}