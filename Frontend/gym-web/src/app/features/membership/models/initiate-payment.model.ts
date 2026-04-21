// Matches payment-service InitiatePaymentRequest record (subscriptionId, planId, paymentMethodToken).
export interface InitiatePaymentRequest {
  subscriptionId: string;
  planId: string;
  paymentMethodToken: string;
}

// Matches payment-service InitiatePaymentResponse record (paymentId, clientSecret).
export interface InitiatePaymentResponse {
  paymentId: string;
  clientSecret: string;
}

// Matches payment-service PaymentStatus enum (PENDING, COMPLETED, FAILED, REFUNDED).
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

// Matches payment-service PaymentResponse record.
export interface PaymentResponse {
  id: string;
  userId: string;
  subscriptionId: string;
  planId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}
