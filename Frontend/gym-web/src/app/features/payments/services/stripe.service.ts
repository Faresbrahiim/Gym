import { Injectable } from '@angular/core';
import { loadStripe, Stripe, PaymentMethod, PaymentIntent, StripeError, StripeElementsOptions, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    // We only load Stripe if a publishable key is defined
    if (environment.stripePublishableKey) {
      this.stripePromise = loadStripe(environment.stripePublishableKey);
    } else {
      this.stripePromise = Promise.resolve(null);
      console.warn('Stripe publishable key is missing from environment configuration.');
    }
  }

  async getStripe(): Promise<Stripe | null> {
    return await this.stripePromise;
  }

  async createPaymentMethod(card: StripeCardElement, billing?: { email?: string }): Promise<{ paymentMethod?: PaymentMethod; error?: StripeError }> {
    const stripe = await this.getStripe();
    if (!stripe) {
      return { error: { type: 'api_error', message: 'Stripe is not initialized' } as StripeError };
    }

    const billingDetails: any = {};
    if (billing?.email) {
      billingDetails.email = billing.email;
    }

    return await stripe.createPaymentMethod({
      type: 'card',
      card: card,
      billing_details: Object.keys(billingDetails).length > 0 ? billingDetails : undefined
    });
  }

  async confirmCardPayment(clientSecret: string): Promise<{ paymentIntent?: PaymentIntent; error?: StripeError }> {
    const stripe = await this.getStripe();
    if (!stripe) {
      return { error: { type: 'api_error', message: 'Stripe is not initialized' } as StripeError };
    }

    return await stripe.confirmCardPayment(clientSecret);
  }

  // Placeholder for when we need to mount elements in the UI
  mountCardElement(hostEl: HTMLElement, opts?: StripeElementsOptions): any {
    // To be implemented when UI is added
    throw new Error('Not implemented yet');
  }

  unmountCardElement(el: any): void {
    // To be implemented when UI is added
    throw new Error('Not implemented yet');
  }
}
