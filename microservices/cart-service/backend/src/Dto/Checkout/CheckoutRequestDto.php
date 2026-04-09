<?php 
namespace App\Dto\Checkout;

final class CheckoutRequestDto
{
    public function __construct(
        public readonly string $address,
        public readonly string $paymentMethod,
        public readonly ?string $notes = null
    ) {}
}