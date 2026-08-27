import type { PaymentStatus, ProductType } from './payment';

export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItemResponse {
  id: string;
  productType: ProductType;
  productRef: string;
  title: string;
  thumbnail?: string | null;
  instructor?: string | null;
  unitPriceCents: number;
  discountCents: number;
  finalPriceCents: number;
  quantity: number;
}

export interface InvoiceResponse {
  id: string;
  orderId: string;
  invoiceNumber: string;
  issuedAt: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerPhone: string | null;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  lineItems: OrderItemResponse[];
  /** Relative download path for HTML invoice. */
  downloadPath: string;
}

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  invoiceNumber: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  items: OrderItemResponse[];
  paymentId: string | null;
  paymentStatus: PaymentStatus | null;
  checkoutUrl?: string;
  invoice?: InvoiceResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutCartDto {
  /** Optional note; reserved for future coupon codes. */
  note?: string;
}

export interface RetryPaymentDto {
  orderId: string;
}
