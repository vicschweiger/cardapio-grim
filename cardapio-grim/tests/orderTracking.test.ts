import assert from 'node:assert/strict';
import test from 'node:test';
import { getTrackedOrders } from '../src/api/checkout.ts';
import { formatPublicOrderNumber, isFinished, normalizeTrackingPhone, startOrderTracking, trackingSteps, type TrackedOrder } from '../src/orders/tracking.ts';

const order = (status: string): TrackedOrder => ({
  order_number: '1042', status, status_label: 'Pedido recebido', order_type: 'delivery',
  total: '58.90', created_at: '2026-09-10T12:00:00Z', updated_at: '2026-09-10T12:00:00Z',
  payment_method: 'money', payment_method_label: 'Dinheiro na entrega', delivery_address: 'Rua Teste, 10',
  items: [{ name: 'Hambúrguer', quantity: '2', unit_price: '25.00', line_total: '50.00', notes: null }],
  subtotal: '50.00', delivery_fee: '10.00', service_fee: '2.00', discount_amount: '3.10',
  coupon_code: 'BEMVINDO', payment_status: 'pending', payment_status_label: 'Pagamento pendente',
  is_paid: false, paid_at: null, change_for: '100.00', refund_status: 'none',
  refund_status_label: 'Sem estorno', refund_amount: '0.00', refunded_at: null,
});
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test('normaliza formatos brasileiros preservando o DDD 55 e rejeitando entradas inválidas', () => {
  for (const phone of ['11999999999', '(11) 99999-9999', '+55 (11) 99999-9999', '5511999999999']) {
    assert.equal(normalizeTrackingPhone(phone), '11999999999');
  }
  assert.equal(normalizeTrackingPhone('+55 (55) 99999-9999'), '55999999999');
  for (const phone of ['', '123', '.*', 'abc11999999999']) assert.equal(normalizeTrackingPhone(phone), null);
});

test('timeline usa status atuais e retirada não mostra etapa de entrega', () => {
  assert.deepEqual(trackingSteps('delivery').map(step => step.status), ['new', 'preparing', 'ready', 'dispatched', 'completed']);
  assert.equal(trackingSteps('pickup').some(step => step.label.includes('entrega')), false);
  assert.equal(trackingSteps('pickup')[3].label, 'Liberado para retirada');
  for (const status of ['completed', 'canceled', 'cancelled']) assert.equal(isFinished(status), true);
  assert.equal(isFinished('ready'), false);
});

test('formata o mesmo número público usado no painel', () => {
  assert.equal(formatPublicOrderNumber(42), '0042');
  assert.equal(formatPublicOrderNumber('1042'), '1042');
  assert.equal(formatPublicOrderNumber(10000), '10000');
  assert.equal(formatPublicOrderNumber(null), null);
});

test('consulta combina empresa e telefone, sem cache e com cancelamento', async t => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (input: string, init: RequestInit) => {
    const url = new URL(input);
    assert.equal(url.pathname, '/api/public/orders/track/');
    assert.equal(url.searchParams.get('company_token'), 'TRACK1');
    assert.equal(url.searchParams.get('phone'), '11999999999');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.signal, controller.signal);
    return new Response(JSON.stringify([order('new')]), { status: 200 });
  });
  assert.equal((await getTrackedOrders('TRACK1', '11999999999', controller.signal))[0].order_number, '1042');
});

test('polling a cada 20 segundos continua para pedidos ativos e para ao finalizar todos', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const results: string[] = [];
  const stop = startOrderTracking(async () => {
    calls++;
    return [order('canceled'), order(calls === 1 ? 'preparing' : 'completed')];
  }, orders => results.push(orders[1].status), assert.fail);
  await flush();
  t.mock.timers.tick(19_999);
  assert.equal(calls, 1);
  t.mock.timers.tick(1);
  await flush();
  assert.deepEqual(results, ['preparing', 'completed']);
  t.mock.timers.tick(60_000);
  assert.equal(calls, 2);
  stop();
});

test('busca vazia ou só cancelados não agenda novas consultas', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const orders of [[], [order('canceled')], [order('cancelled')]]) {
    let calls = 0;
    const stop = startOrderTracking(async () => { calls++; return orders; }, () => {}, assert.fail);
    await flush();
    t.mock.timers.tick(60_000);
    assert.equal(calls, 1);
    stop();
  }
});

test('desmontagem aborta a consulta e ignora resposta atrasada; não sobrepõe requisições', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let resolve: (orders: TrackedOrder[]) => void = () => {};
  let signal: AbortSignal | undefined;
  let calls = 0;
  const results: TrackedOrder[][] = [];
  const stop = startOrderTracking(currentSignal => {
    signal = currentSignal;
    calls++;
    return new Promise(done => { resolve = done; });
  }, orders => results.push(orders), assert.fail);
  t.mock.timers.tick(80_000);
  assert.equal(calls, 1);
  stop();
  assert.equal(signal?.aborted, true);
  resolve([order('new')]);
  await flush();
  t.mock.timers.tick(80_000);
  assert.equal(calls, 1);
  assert.deepEqual(results, []);
});

test('falha de rede permite nova atualização e rate limit interrompe tentativas automáticas', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  let errors = 0;
  const stop = startOrderTracking(async () => {
    calls++;
    if (calls === 1) throw new Error('Sem conexão');
    throw Object.assign(new Error('Limite excedido'), { status: 429 });
  }, assert.fail, () => { errors++; });
  await flush();
  t.mock.timers.tick(20_000);
  await flush();
  t.mock.timers.tick(60_000);
  assert.equal(calls, 2);
  assert.equal(errors, 2);
  stop();
});
