export interface TrackedOrder {
  order_number: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string;
  status_label: string;
  order_type: 'pickup' | 'delivery';
  total: string;
  payment_method: string;
  payment_method_label: string;
  delivery_address: string | null;
}

export const isCanceled = (status: string) => status === 'canceled' || status === 'cancelled';
export const isFinished = (status: string) => status === 'completed' || isCanceled(status);

export function trackingSteps(orderType: TrackedOrder['order_type']) {
  return [
    { status: 'new', label: 'Pedido recebido' },
    { status: 'preparing', label: 'Em preparo' },
    { status: 'ready', label: 'Pronto' },
    { status: 'dispatched', label: orderType === 'pickup' ? 'Liberado para retirada' : 'Saiu para entrega' },
    { status: 'completed', label: 'Finalizado' },
  ];
}

export function normalizeTrackingPhone(value: string): string | null {
  if (value.length > 32 || /[^0-9+()\s-]/.test(value)) return null;
  let digits = value.replace(/[^0-9]/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
  return /^\d{10,11}$/.test(digits) ? digits : null;
}

// Schedule only after a response: no overlapping requests or stale updates after cleanup.
export function startOrderTracking(
  fetchOrders: (signal: AbortSignal) => Promise<TrackedOrder[]>,
  onOrders: (orders: TrackedOrder[]) => void,
  onError: (error: unknown) => void,
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = async () => {
    let continuePolling = true;
    try {
      const orders = await fetchOrders(controller.signal);
      if (controller.signal.aborted) return;
      onOrders(orders);
      continuePolling = orders.some(order => !isFinished(order.status));
    } catch (error) {
      if (controller.signal.aborted) return;
      onError(error);
      const status = (error as { status?: number } | null)?.status;
      continuePolling = status !== 400 && status !== 404 && status !== 429;
    }
    if (!controller.signal.aborted && continuePolling) timer = setTimeout(() => void refresh(), 20_000);
  };
  void refresh();
  return () => {
    controller.abort();
    clearTimeout(timer);
  };
}
