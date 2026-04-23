import { SubscriptionStatus } from './subscription-status.enum';

export interface SubscriptionHistoryEntry {
  historyId: string;
  subscriptionId: string;
  previousStatus: SubscriptionStatus | null;
  newStatus: SubscriptionStatus;
  changedAt: string;
  changedBy: string | null;
  note: string | null;
}
