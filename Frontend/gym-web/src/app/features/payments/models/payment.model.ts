import { PaymentStatus } from './payment-status.enum';

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
