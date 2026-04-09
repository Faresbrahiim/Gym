<?php
// src/Service/CheckoutService.php

namespace App\Service;

use App\Entity\Order;
use App\Service\OrderService;
use App\Repository\OrderRepository;
use Symfony\Component\Uid\Uuid;

class CheckoutService implements CheckoutServiceInterface
{
    public function __construct(
        private OrderService $orderService,
        private OrderRepository $orderRepository
    ) {}

    public function processCheckout(Uuid $userId, array $checkoutData): Order
    {
        // 1. Use the existing OrderService to convert Cart to Order
        // This handles snapshotting and clearing the cart
        $order = $this->orderService->createOrderFromCart($userId);

        // 2. Map the Checkout-specific data
        // For now, we assume these exist as fields or you can handle them via a 'Logs' or 'Shipping' table
        // For this example, let's assume you store them in the Order status or a meta field
        $address = $checkoutData['address'] ?? 'No address provided';
        $paymentMethod = $checkoutData['paymentMethod'] ?? 'Unknown';

        // Example: Update status to 'PAID' or 'PROCESSING' based on payment
        $order->setStatus('PROCESSING');
        
        $this->orderRepository->save($order, true);

        return $order;
    }
}