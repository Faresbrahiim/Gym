import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StripeCardElement, StripeError, PaymentMethod } from '@stripe/stripe-js';
import { StripeService } from '../../services/stripe.service';

@Component({
  selector: 'app-stripe-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stripe-card.component.html',
  styleUrl: './stripe-card.component.css'
})
export class StripeCardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cardElement') cardElementRef!: ElementRef;
  @Output() errorChange = new EventEmitter<string | null>();

  private stripeService = inject(StripeService);
  private cardElement: StripeCardElement | null = null;
  
  isReady = false;
  errorMessage: string | null = null;

  async ngAfterViewInit() {
    const stripe = await this.stripeService.getStripe();
    if (!stripe) {
      this.setError('Stripe failed to load.');
      return;
    }

    const elements = stripe.elements();
    this.cardElement = elements.create('card', {
      style: {
        base: {
          color: '#32325d',
          fontFamily: '"Inter", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });

    this.cardElement.mount(this.cardElementRef.nativeElement);

    this.cardElement.on('change', (event) => {
      this.isReady = event.complete;
      if (event.error) {
        this.setError(event.error.message);
      } else {
        this.setError(null);
      }
    });
  }

  ngOnDestroy() {
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement.destroy();
    }
  }

  private setError(msg: string | null) {
    this.errorMessage = msg;
    this.errorChange.emit(msg);
  }

  async createPaymentMethod(billingDetails?: { email?: string }): Promise<{ paymentMethod?: PaymentMethod; error?: StripeError }> {
    if (!this.cardElement) {
      return { error: { type: 'api_error', message: 'Card element not initialized' } as unknown as StripeError };
    }
    return this.stripeService.createPaymentMethod(this.cardElement, billingDetails);
  }
}
