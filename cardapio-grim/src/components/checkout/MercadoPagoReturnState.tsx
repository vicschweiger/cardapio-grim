import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Loader2, RotateCw } from 'lucide-react';
import { getOrderPaymentStatus } from '../../api/checkout';
import type { MercadoPagoReturnResult, OrderStatusResponse } from '../../types/checkout';

interface MercadoPagoReturnStateProps {
  companySlug: string;
  orderId: number;
  returnResult: MercadoPagoReturnResult;
  onOrderFound: () => void;
  onBackToMenu: () => void;
}

export function MercadoPagoReturnState({ companySlug, orderId, returnResult, onOrderFound, onBackToMenu }: MercadoPagoReturnStateProps) {
  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);
      const currentOrder = await getOrderPaymentStatus(companySlug, orderId, signal);
      setOrder(currentOrder);
      if (currentOrder.payment_status === 'approved' && currentOrder.is_paid === true) onOrderFound();
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível consultar o pagamento.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [companySlug, onOrderFound, orderId]);

  useEffect(() => {
    const controller = new AbortController();
    void refreshStatus(controller.signal);
    return () => controller.abort();
  }, [refreshStatus]);

  useEffect(() => {
    if (!order || order.payment_status !== 'pending') return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => void refreshStatus(controller.signal), 3000);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [order, refreshStatus]);

  const approved = order?.payment_status === 'approved' && order.is_paid === true;
  const failed = order ? ['rejected', 'cancelled'].includes(order.payment_status) : returnResult === 'failure';

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:py-10 font-sans">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 sm:p-8 text-center shadow-xl space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Pedido #{orderId}</h1>

        {isLoading && !order && <div className="py-10 text-gray-500" role="status"><Loader2 className="mx-auto mb-3 h-9 w-9 animate-spin" /><p>Consultando pagamento...</p></div>}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800" role="alert">
            <AlertCircle className="mx-auto mb-3 h-10 w-10" />
            <p className="font-bold">Não foi possível confirmar o status</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {order && (
          <>
            <p className="text-lg font-semibold text-gray-700">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}</p>
            <div className={`rounded-xl border p-5 ${approved ? 'border-green-200 bg-green-50 text-green-800' : failed ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {approved ? <CheckCircle2 className="mx-auto mb-3 h-10 w-10" /> : failed ? <AlertCircle className="mx-auto mb-3 h-10 w-10" /> : <Clock3 className="mx-auto mb-3 h-10 w-10" />}
              <p className="font-bold">{approved ? 'Pagamento confirmado' : failed ? 'Pagamento não aprovado' : 'Pagamento pendente'}</p>
              <p className="mt-1 text-sm">{approved ? 'A confirmação foi recebida pelo backend.' : failed ? 'Você pode voltar ao cardápio e tentar novamente.' : 'Aguardando a confirmação do Mercado Pago pelo backend. O status será atualizado automaticamente.'}</p>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!approved && <button type="button" onClick={() => void refreshStatus()} disabled={isLoading} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal-600 px-4 font-bold text-teal-700 disabled:opacity-60"><RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Atualizar status</button>}
          <button type="button" onClick={onBackToMenu} className="min-h-12 rounded-xl bg-teal-600 px-4 font-bold text-white">Voltar ao cardápio</button>
        </div>
      </section>
    </main>
  );
}
