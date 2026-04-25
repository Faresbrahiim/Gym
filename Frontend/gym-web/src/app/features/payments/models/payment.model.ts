import { PaymentStatus } from './payment-status.enum';
import { PaymentTargetType } from './payment-target-type.enum';

export interface PaymentResponse {
  id: string;
  userId: string;
  targetType: PaymentTargetType;
  subscriptionId: string | null;
  planId: string | null;
  orderId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}
