import { SubscriptionStatus } from './subscription-status.enum';

export interface Subscription {
  subscriptionId: string;
  userId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  freezeStartDate: string | null;
  freezeEndDate: string | null;
}
