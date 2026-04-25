import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../../cart/services/cart.service';
import { OrderService } from '../../../orders/services/order.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly cartService  = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly toastService = inject(ToastService);
  private readonly router       = inject(Router);

  cart        = this.cartService.cart$;
  isLoading   = this.orderService.isLoading$;
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
      country:       ['', Validators.required],
      paymentMethod: ['credit-card', Validators.required]
    });
  }

  nextStep(): void { if (this.currentStep() < 3) this.currentStep.update(s => s + 1); }
  prevStep(): void { if (this.currentStep() > 1) this.currentStep.update(s => s - 1); }

  onPlaceOrder(): void {
    if (this.checkoutForm.invalid) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    const v = this.checkoutForm.value;
    const shippingAddress = `${v.firstName} ${v.lastName}, ${v.address}, ${v.city}, ${v.postalCode}, ${v.country}`;

    this.orderService.checkout(shippingAddress, v.paymentMethod).subscribe({
      next: response => {
        this.toastService.success('Order placed successfully!');
        this.router.navigate(['/orders', response.orderId]);
      },
      error: () => this.toastService.error('Failed to place order')
    });
  }

  getProductName(item: { productName: string; productId: string }): string {
    return item.productName || `Product #${item.productId}`;
  }

  getTaxAmount(): number   { return (this.cart()?.totalPrice ?? 0) * 0.1; }
  getTotalAmount(): number { return (this.cart()?.totalPrice ?? 0) * 1.1; }
}
