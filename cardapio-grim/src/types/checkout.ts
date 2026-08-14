export type PaymentMethod = 'money' | 'card' | 'pix_manual' | 'mercadopago';

export type CardType = 'credit' | 'debit';

export type PaymentStatus =
  | 'pending'
  | 'waiting_confirmation'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export interface PaymentConfig {
  pix: {
    enabled: boolean;
    key: string;
    key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | '';
    receiver_name: string;
  };
  mercadopago: {
    enabled: boolean;
    connected: boolean;
    pix_enabled: boolean;
    card_enabled: boolean;
  };
  /** Campos opcionais para compatibilidade quando o backend passar a configurá-los. */
  money?: { enabled: boolean };
  card_on_delivery?: { enabled: boolean };
}

export interface OrderItemPayload {
  produto: string;
  qtd: number;
  preco: number;
  obs: string;
}

export interface MercadoPagoItemPayload {
  product_id: number;
  quantity: number;
  obs: string;
}

export interface CommonOrderPayload {
  customer_name: string;
  customer_phone: string;
  is_pickup: boolean;
  delivery_address: string;
  delivery_cep: string;
  delivery_street: string;
  delivery_number: string;
  delivery_complement: string;
  delivery_neighborhood: string;
  delivery_city: string;
  delivery_state: string;
  delivery_instructions: string;
}

export interface DeliveryOrderPayload extends CommonOrderPayload {
  items: OrderItemPayload[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  total_amount: number;
  payment_method: 'money' | 'card_credit' | 'card_debit' | 'pix_manual';
  change_for: number | null;
  is_paid: false;
  status: 'new';
  coupon_applied: string | null;
}

export interface MercadoPagoCheckoutPayload extends CommonOrderPayload {
  items: MercadoPagoItemPayload[];
  payment_method: 'mercadopago';
}

export interface CreatedOrderResponse {
  order_id: number;
  status?: string;
  message?: string;
  total_amount?: string;
  pix_code?: string;
  pix_qr_code?: string;
  payment_status?: PaymentStatus;
}

export interface MercadoPagoCheckoutResponse {
  order_id: number;
  payment_status: PaymentStatus;
  preference_id: string;
  init_point: string;
  sandbox_init_point?: string | null;
  public_key?: string | null;
  total_amount: string;
}

export interface OrderStatusResponse {
  order_id: number;
  total_amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  is_paid: boolean;
}

export interface PixPaymentDeclaredResponse {
  order_id: number;
  payment_status: 'waiting_confirmation';
  is_paid: false;
  message: string;
}

export type MercadoPagoReturnResult = 'success' | 'pending' | 'failure';
