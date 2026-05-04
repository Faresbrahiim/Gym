export interface MembershipEntitlements {
  sessionBookingAllowed: boolean;
  sessionBookingReason: string | null;
  aiCoachAllowed: boolean;
  aiCoachReason: string | null;
  capabilities: string[];
}
