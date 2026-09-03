import type {
  CreatedOrderResponse,
  DeliveryOrderPayload,
  MercadoPagoCheckoutPayload,
  MercadoPagoCheckoutResponse,
  OrderStatusResponse,
  PaymentConfig,
  PixPaymentDeclaredResponse,
  ValidateCouponResponse,
} from '../types/checkout';

const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api').replace(/\/$/, '');
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export interface PublicPaymentMethods {
  pix_enabled: boolean;
  mercadopago_enabled: boolean;
  mercadopago_pix_enabled: boolean;
  mercadopago_card_enabled: boolean;
  money_enabled: boolean;
  card_enabled: boolean;
}

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

export function normalizePublicPaymentMethods(methods: PublicPaymentMethods): PaymentConfig {
  return {
    pix: { enabled: methods.pix_enabled, key: '', key_type: '', receiver_name: '' },
    mercadopago: {
      enabled: methods.mercadopago_enabled,
      connected: methods.mercadopago_enabled,
      pix_enabled: methods.mercadopago_pix_enabled,
      card_enabled: methods.mercadopago_card_enabled,
    },
    money: { enabled: methods.money_enabled },
    card_on_delivery: { enabled: methods.card_enabled },
  };
}

export async function getPaymentConfig(companyToken: string, signal?: AbortSignal) {
  const methods = await requestJson<PublicPaymentMethods>(
    `${API_BASE_URL}/public/${encodeURIComponent(companyToken)}/payment-methods/`,
    { signal },
  );
  return normalizePublicPaymentMethods(methods);
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

export function validateCoupon(
  companyToken: string,
  couponCode: string,
  subtotal: number,
  deliveryFee: number,
) {
  return requestJson<ValidateCouponResponse>(
    `${API_BASE_URL}/coupons/${encodeURIComponent(companyToken)}/validate/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon_code: couponCode,
        subtotal,
        delivery_fee: deliveryFee,
      }),
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
