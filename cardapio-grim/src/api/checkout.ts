import type {
  CreatedOrderResponse,
  DeliveryOrderPayload,
  MercadoPagoCheckoutPayload,
  MercadoPagoCheckoutResponse,
  OrderStatusResponse,
  PaymentConfig,
  PixPaymentDeclaredResponse,
} from '../types/checkout';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api').replace(/\/$/, '');
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export class CheckoutApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CheckoutApiError';
    this.status = status;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof data.error === 'string'
      ? data.error
      : typeof data.detail === 'string'
        ? data.detail
        : 'Não foi possível concluir a solicitação.';
    throw new CheckoutApiError(message, response.status);
  }

  return data as T;
}

export function getPaymentConfig(companyToken: string, signal?: AbortSignal) {
  return requestJson<PaymentConfig>(
    `${API_ORIGIN}/company/payment-config/${encodeURIComponent(companyToken)}/`,
    { signal },
  );
}

export function createDeliveryOrder(companyToken: string, payload: DeliveryOrderPayload) {
  return requestJson<CreatedOrderResponse>(
    `${API_BASE_URL}/orders/${encodeURIComponent(companyToken)}/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export function createMercadoPagoCheckout(
  companyToken: string,
  payload: MercadoPagoCheckoutPayload,
  idempotencyKey: string,
) {
  return requestJson<MercadoPagoCheckoutResponse>(
    `${API_BASE_URL}/orders/${encodeURIComponent(companyToken)}/checkout/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    },
  );
}

export function declarePixPayment(orderId: number) {
  return requestJson<PixPaymentDeclaredResponse>(
    `${API_ORIGIN}/orders/${orderId}/pix/payment-declared/`,
    { method: 'POST' },
  );
}

export async function getOrderPaymentStatus(
  companyToken: string,
  orderId: number,
  signal?: AbortSignal,
): Promise<OrderStatusResponse> {
  return requestJson<OrderStatusResponse>(
    `${API_BASE_URL}/orders/${encodeURIComponent(companyToken)}/${orderId}/payment-status/`,
    { signal, cache: 'no-store' },
  );
}
