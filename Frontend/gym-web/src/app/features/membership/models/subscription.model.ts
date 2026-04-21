import { SubscriptionStatus } from './subscription-status.enum';

export interface Subscription {
  subscriptionId: string;
  userId: string;
  userEmail: string | null;
  planId: string;
  planName: string;
  planPrice: number | null;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  freezeStartDate: string | null;
  freezeEndDate: string | null;
}
