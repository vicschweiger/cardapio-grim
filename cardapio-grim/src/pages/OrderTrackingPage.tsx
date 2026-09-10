import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Package, Search, XCircle } from 'lucide-react';
import { getTrackedOrders } from '../api/checkout';
import { isCanceled, isFinished, normalizeTrackingPhone, startOrderTracking, trackingSteps, type TrackedOrder } from '../orders/tracking';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });
const money = (value?: string | null) => currency.format(Number(value || 0));

function TrackingContent({ companySlug }: { companySlug: string }) {
  const location = useLocation();
  const initialPhone = location.state?.companySlug === companySlug && typeof location.state?.phone === 'string'
    ? location.state.phone : '';
  const [phone, setPhone] = useState(initialPhone);
  const [search, setSearch] = useState<{ phone: string } | null>(() => {
    const normalized = normalizeTrackingPhone(initialPhone);
    return normalized ? { phone: normalized } : null;
  });
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(Boolean(search));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!search) return;
    return startOrderTracking(
      signal => getTrackedOrders(companySlug, search.phone, signal),
      found => { setOrders(found); setLoading(false); setError(''); },
      failure => {
        setLoading(false);
        setError(failure instanceof Error ? failure.message : 'Não foi possível atualizar os pedidos. Tente novamente.');
      },
    );
  }, [companySlug, search]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeTrackingPhone(phone);
    if (!normalized) { setError('Informe um número de celular válido com DDD.'); return; }
    setError('');
    setOrders(null);
    setLoading(true);
    setSearch({ phone: normalized });
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to={`/${companySlug}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-teal-700"><ArrowLeft size={18} />Voltar ao cardápio</Link>
        <header>
          <Package className="mb-3 h-9 w-9 text-teal-700" aria-hidden="true" />
          <h1 className="text-3xl font-black tracking-tight">Acompanhe seu pedido</h1>
          <p className="mt-2 text-sm text-stone-600">Consulte o andamento dos seus pedidos neste estabelecimento.</p>
        </header>
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <label htmlFor="tracking-phone" className="block text-sm font-semibold">Digite o número de celular usado no pedido</label>
          <input id="tracking-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={32} required value={phone} onChange={event => setPhone(event.target.value)} placeholder="(11) 99999-9999" className="min-h-12 w-full rounded-xl border border-stone-300 px-4 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
          <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 font-bold text-white hover:bg-teal-800 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={18} />}Buscar pedido
          </button>
        </form>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}{orders && ' As informações abaixo podem estar desatualizadas.'}</p>}
        {loading && <p role="status" className="text-sm text-stone-600">Buscando pedidos...</p>}
        {orders?.length === 0 && <p role="status" className="rounded-xl border border-stone-200 bg-white p-5">Nenhum pedido encontrado para esse celular neste estabelecimento. Confira o número informado.</p>}
        <div className="space-y-4" aria-live="polite" aria-atomic="false">
          {orders?.map((order, index) => {
            const steps = trackingSteps(order.order_type);
            const current = steps.findIndex(step => step.status === order.status);
            const canceled = isCanceled(order.status);
            return (
              <article key={`${order.order_number}-${order.created_at}-${index}`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{order.order_number ? `Pedido #${order.order_number}` : 'Pedido sem número público'}</h2>
                    <p className="mt-1 text-sm text-stone-500">{order.created_at ? dateTime.format(new Date(order.created_at)) : 'Data indisponível'}</p>
                  </div>
                  <p className="text-lg font-bold">{money(order.total)}</p>
                </div>
                <p className="mt-3 text-sm text-stone-600">{order.order_type === 'pickup' ? 'Retirada na loja' : 'Entrega'}</p>
                <dl className="mt-4 grid gap-3 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-stone-500">Forma de pagamento</dt>
                    <dd className="mt-1 font-medium text-stone-800">{order.payment_method_label || 'Não informada'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-stone-500">Endereço do pedido</dt>
                    <dd className="mt-1 font-medium text-stone-800">
                      {order.order_type === 'pickup' ? 'Retirada no estabelecimento' : order.delivery_address || 'Endereço não informado'}
                    </dd>
                  </div>
                </dl>
                <section className="mt-4 overflow-hidden rounded-xl border border-stone-200" aria-label={`Resumo financeiro do pedido ${order.order_number || ''}`}>
                  <div className="border-b border-dashed border-stone-300 bg-stone-50 px-4 py-3">
                    <h3 className="font-bold text-stone-900">Resumo do pedido</h3>
                    <p className="text-xs text-stone-500">Itens e faturamento</p>
                  </div>
                  <div className="divide-y divide-dashed divide-stone-200 px-4">
                    {(order.items || []).map((item, itemIndex) => (
                      <div key={`${item.name}-${itemIndex}`} className="flex gap-3 py-3 text-sm">
                        <span className="font-bold text-stone-700">{item.quantity}×</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-stone-900">{item.name}</p>
                          <p className="text-xs text-stone-500">{money(item.unit_price)} cada</p>
                          {item.notes && <p className="mt-1 text-xs italic text-stone-500">Observação: {item.notes}</p>}
                        </div>
                        <span className="font-semibold text-stone-800">{money(item.line_total)}</span>
                      </div>
                    ))}
                    {(order.items || []).length === 0 && <p className="py-3 text-sm text-stone-500">Itens não disponíveis para este pedido.</p>}
                  </div>
                  <dl className="space-y-2 border-t border-stone-200 bg-stone-50 px-4 py-4 text-sm">
                    <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{money(order.subtotal ?? order.total)}</dd></div>
                    {Number(order.delivery_fee || 0) > 0 && <div className="flex justify-between gap-3"><dt>Frete</dt><dd>{money(order.delivery_fee)}</dd></div>}
                    {Number(order.service_fee || 0) > 0 && <div className="flex justify-between gap-3"><dt>Taxa de serviço</dt><dd>{money(order.service_fee)}</dd></div>}
                    {order.coupon_code && <div className="flex justify-between gap-3 text-emerald-700"><dt>Cupom {order.coupon_code}</dt><dd>{Number(order.discount_amount || 0) > 0 ? `− ${money(order.discount_amount)}` : 'Aplicado'}</dd></div>}
                    {!order.coupon_code && Number(order.discount_amount || 0) > 0 && <div className="flex justify-between gap-3 text-emerald-700"><dt>Desconto</dt><dd>− {money(order.discount_amount)}</dd></div>}
                    <div className="flex justify-between gap-3 border-t border-stone-300 pt-3 text-base font-black"><dt>Total</dt><dd>{money(order.total)}</dd></div>
                  </dl>
                  <dl className="space-y-2 border-t border-dashed border-stone-300 px-4 py-4 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-stone-500">Situação do pagamento</dt><dd className="text-right font-bold">{order.payment_status_label || 'Não informada'}</dd></div>
                    {order.paid_at && <div className="flex justify-between gap-3"><dt className="text-stone-500">Pago em</dt><dd>{dateTime.format(new Date(order.paid_at))}</dd></div>}
                    {order.change_for && <div className="flex justify-between gap-3"><dt className="text-stone-500">Troco para</dt><dd>{money(order.change_for)}</dd></div>}
                    {order.refund_status && order.refund_status !== 'none' && <div className="flex justify-between gap-3"><dt className="text-stone-500">Estorno</dt><dd className="text-right font-bold">{order.refund_status_label}</dd></div>}
                    {Number(order.refund_amount || 0) > 0 && <div className="flex justify-between gap-3"><dt className="text-stone-500">Valor estornado</dt><dd>{money(order.refund_amount)}</dd></div>}
                    {order.refunded_at && <div className="flex justify-between gap-3"><dt className="text-stone-500">Estornado em</dt><dd>{dateTime.format(new Date(order.refunded_at))}</dd></div>}
                  </dl>
                </section>
                <p className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${canceled ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-800'}`}>
                  {canceled && <XCircle size={18} />}{order.status_label}
                </p>
                {!canceled && current >= 0 && (
                  <ol className="mt-5 space-y-0" aria-label="Etapas do pedido">
                    {steps.map((step, stepIndex) => (
                      <li key={step.status} aria-current={stepIndex === current ? 'step' : undefined} className="flex gap-3">
                        <div className="flex w-6 flex-col items-center" aria-hidden="true">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${stepIndex <= current ? 'border-teal-700 bg-teal-700 text-white' : 'border-stone-200 bg-white'}`}>{stepIndex < current ? <Check size={14} /> : stepIndex === current ? <span className="h-2 w-2 rounded-full bg-white" /> : null}</span>
                          {stepIndex < steps.length - 1 && <span className={`min-h-6 w-0.5 flex-1 ${stepIndex < current ? 'bg-teal-700' : 'bg-stone-200'}`} />}
                        </div>
                        <p className={`pb-5 text-sm ${stepIndex === current ? 'font-bold text-teal-800' : stepIndex < current ? 'text-stone-700' : 'text-stone-500'}`}>{step.label}{stepIndex === current && <span className="sr-only"> — status atual</span>}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            );
          })}
        </div>
        {orders && orders.some(order => !isFinished(order.status)) && !error && <p className="text-center text-xs text-stone-500">Atualização automática a cada 20 segundos.</p>}
      </div>
    </main>
  );
}

export default function OrderTrackingPage() {
  const { company_slug = '' } = useParams();
  return <TrackingContent key={company_slug} companySlug={company_slug} />;
}
