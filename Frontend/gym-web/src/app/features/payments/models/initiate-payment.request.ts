export interface InitiatePaymentRequest {
  subscriptionId: string;
  planId: string;
  paymentMethodToken: string;
}
