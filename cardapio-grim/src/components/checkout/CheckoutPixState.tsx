import { useState } from 'react';
import { Check, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { declarePixPayment } from '../../api/checkout';
import type { CreatedOrderResponse } from '../../types/checkout';

interface CheckoutPixStateProps {
  order: CreatedOrderResponse;
  companySlug: string;
  onBackToMenu: () => void;
}

const formatCurrency = (value: string | undefined) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(Number(value || 0));

export function CheckoutPixState({ order, onBackToMenu }: CheckoutPixStateProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeclaring, setIsDeclaring] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyPixCode = async () => {
    if (!order.pix_code) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(order.pix_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione o código abaixo e copie manualmente.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleDeclarePayment = async () => {
    try {
      setIsDeclaring(true);
      setError(null);
      await declarePixPayment(order.order_id);
      setDeclared(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível informar o pagamento.');
    } finally {
      setIsDeclaring(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:py-10 font-sans">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 sm:p-8 text-center shadow-xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.order_id}</h1>
          <p className="mt-1 text-lg font-semibold text-teal-700">Total: {formatCurrency(order.total_amount)}</p>
        </div>

        {!declared ? (
          <>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pague usando PIX</h2>
              <p className="mt-1 text-sm text-gray-500">Abra o app do seu banco e escaneie o QR Code.</p>
            </div>

            {order.pix_qr_code && (
              <img src={order.pix_qr_code} alt="QR Code para pagamento PIX" className="mx-auto h-auto w-full max-w-64 rounded-xl border border-gray-100" />
            )}

            {order.pix_code && (
              <div className="space-y-3">
                <p className="max-h-24 overflow-y-auto break-all rounded-xl bg-gray-50 p-3 text-left font-mono text-xs text-gray-600 select-all">{order.pix_code}</p>
                <button type="button" onClick={copyPixCode} disabled={isCopying} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 font-bold text-white hover:bg-teal-700 disabled:opacity-60">
                  {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Código copiado' : 'Copiar código PIX'}
                </button>
              </div>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
              <p className="font-bold">Envie o comprovante ao restaurante</p>
              <p className="mt-1">Se possível, após pagar envie o comprovante pelo canal de contato do restaurante. Isso pode ajudar na conferência do PIX.</p>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <p className="mb-3 text-sm text-gray-600">Após efetuar o pagamento:</p>
              <button type="button" onClick={handleDeclarePayment} disabled={isDeclaring} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-teal-600 px-4 font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-60">
                {isDeclaring && <Loader2 className="h-4 w-4 animate-spin" />}
                Já fiz o pagamento
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-800" role="status">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10" />
            <p className="font-bold">Pagamento informado.</p>
            <p className="mt-1 text-sm">O estabelecimento confirmará o recebimento.</p>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        {declared && <button type="button" onClick={onBackToMenu} className="w-full min-h-12 rounded-xl bg-teal-600 px-4 font-bold text-white">Voltar ao cardápio</button>}
      </section>
    </main>
  );
}
