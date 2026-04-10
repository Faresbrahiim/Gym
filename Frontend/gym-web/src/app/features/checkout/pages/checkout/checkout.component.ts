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
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  cart = this.cartService.cart$;
  isLoading = this.orderService.isLoading$;
  checkoutForm!: FormGroup;
  currentStep = signal(1);

  ngOnInit(): void {
    this.cartService.getCart().subscribe();
    this.initCheckoutForm();
  }

  initCheckoutForm(): void {
    this.checkoutForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      paymentMethod: ['credit-card', [Validators.required]]
    });
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  onPlaceOrder(): void {
    if (this.checkoutForm.invalid) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    const formValue = this.checkoutForm.value;
    const shippingAddress = `${formValue.firstName} ${formValue.lastName}, ${formValue.address}, ${formValue.city}, ${formValue.postalCode}, ${formValue.country}`;

    this.orderService.createOrder(shippingAddress).subscribe({
      next: (order) => {
        this.toastService.success('Order placed successfully!');
        this.cartService.clearCart().subscribe();
        this.router.navigate(['/orders', order.id]);
      },
      error: () => {
        this.toastService.error('Failed to place order');
      }
    });
  }

  getTaxAmount(): number {
    return (this.cart()?.totalPrice || 0) * 0.1;
  }

  getTotalAmount(): number {
    const subtotal = this.cart()?.totalPrice || 0;
    return subtotal + this.getTaxAmount();
  }
}
