// Matches backend SubscriptionStatus enum in membership-service verbatim (all 11 values).
export type SubscriptionStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'PAUSED'
  | 'EXPIRED'
  | 'UPGRADED'
  | 'DOWNGRADED'
  | 'PAUSE_REQUESTED'
  | 'FROZEN'
  | 'CANCEL_REQUESTED'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED';

// Statuses considered "current" (membership is ongoing or in-progress).
export const ACTIVE_STATUSES: SubscriptionStatus[] = [
  'ACTIVE',
  'PENDING_PAYMENT',
  'PAUSED',
  'PAUSE_REQUESTED',
  'FROZEN',
  'CANCEL_REQUESTED',
];

// Statuses considered terminal / historical for the current subscription slot.
export const TERMINAL_STATUSES: SubscriptionStatus[] = [
  'CANCELLED',
  'EXPIRED',
  'PAYMENT_FAILED',
  'UPGRADED',
  'DOWNGRADED',
];
