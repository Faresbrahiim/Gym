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
        $order = $this->orderService->createOrderFromCart($userId);
        // Shipping/payment form data is accepted by the checkout flow, but the order
        // stays pending until centralized payment confirmation arrives.
        $order->setStatus('PENDING_PAYMENT');
        $this->orderRepository->save($order, true);

        return $order;
    }
}
