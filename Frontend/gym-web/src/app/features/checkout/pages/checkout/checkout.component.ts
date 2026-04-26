import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../../cart/services/cart.service';
import { OrderService } from '../../../orders/services/order.service';
import { PaymentService } from '../../../payments/services/payment.service';
import { StripeService } from '../../../payments/services/stripe.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { StripeCardComponent } from '../../../payments/components/stripe-card/stripe-card.component';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule, StripeCardComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  @ViewChild(StripeCardComponent) stripeCard?: StripeCardComponent;

  private readonly fb           = inject(FormBuilder);
  private readonly cartService  = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly stripeService = inject(StripeService);
  private readonly toastService = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  private readonly router       = inject(Router);

  cart        = this.cartService.cart$;
  isLoading   = this.orderService.isLoading$;
  isSubmitting = signal(false);
  paymentErrorMessage = signal<string | null>(null);
  checkoutForm!: FormGroup;
  currentStep = signal(1);

  ngOnInit(): void {
    this.cartService.getCart().subscribe();
    this.checkoutForm = this.fb.group({
      firstName:     ['', Validators.required],
      lastName:      ['', Validators.required],
      email:         ['', [Validators.required, Validators.email]],
      phone:         ['', Validators.required],
      address:       ['', Validators.required],
      city:          ['', Validators.required],
      postalCode:    ['', Validators.required],
      paymentMethod: ['credit-card', Validators.required]
    });
  }

  nextStep(): void { if (this.currentStep() < 3) this.currentStep.update(s => s + 1); }
  prevStep(): void { if (this.currentStep() > 1) this.currentStep.update(s => s - 1); }

  async onPlaceOrder(): Promise<void> {
    if (this.checkoutForm.invalid || this.isSubmitting()) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    const v = this.checkoutForm.value;
    if (v.paymentMethod !== 'credit-card') {
      this.toastService.error('Only card payments are available right now.');
      return;
    }

    if (!this.stripeCard) {
      this.toastService.error('Payment form not loaded. Please refresh.');
      return;
    }

    this.isSubmitting.set(true);
    this.paymentErrorMessage.set(null);

    const shippingAddress = `${v.firstName} ${v.lastName}, ${v.address}, ${v.city}, ${v.postalCode}`;

    const { paymentMethod, error: paymentMethodError } = await this.stripeCard.createPaymentMethod({
      email: v.email
    });

    if (paymentMethodError || !paymentMethod) {
      this.paymentErrorMessage.set(paymentMethodError?.message || 'Invalid card details.');
      this.isSubmitting.set(false);
      return;
    }

    let orderId: string | null = null;

    try {
      const response = await firstValueFrom(this.orderService.checkout(shippingAddress, v.paymentMethod));
      orderId = response.orderId;

      const payment = await firstValueFrom(this.paymentService.initiateOrderPayment({
        orderId,
        paymentMethodToken: paymentMethod.id
      }));

      const { error: confirmError } = await this.stripeService.confirmCardPayment(payment.clientSecret);
      void firstValueFrom(this.cartService.getCart());

      if (confirmError) {
        this.toastService.error('Payment confirmation failed. We will keep checking your order status.');
      } else {
        this.toastService.info('Payment received. We are finalizing your order now.');
      }

      await this.router.navigate(['/orders', orderId], {
        queryParams: { payment: '1' }
      });
      return;
    } catch (err) {
      const message = this.errorService.extractMessage(err);
      this.paymentErrorMessage.set(message);
      this.toastService.error(message || 'Failed to place order');

      if (orderId) {
        await this.router.navigate(['/orders', orderId], {
          queryParams: { payment: '1' }
        });
        return;
      }
    }

    this.isSubmitting.set(false);
  }

  onCardErrorChange(message: string | null): void {
    this.paymentErrorMessage.set(message);
  }

  getProductName(item: { productName: string; productId: string }): string {
    return item.productName || `Product #${item.productId}`;
  }

  getTaxAmount(): number   { return (this.cart()?.totalPrice ?? 0) * 0.1; }
  getTotalAmount(): number { return (this.cart()?.totalPrice ?? 0) * 1.1; }
}
