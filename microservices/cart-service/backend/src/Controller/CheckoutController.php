<?php
// src/Controller/CheckoutController.php

namespace App\Controller;

use App\Service\CheckoutService;
use App\Service\OrderService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/store/checkout')]
class CheckoutController extends AbstractController
{
    public function __construct(
        private CheckoutService $checkoutService,
    ) {}

    #[Route('', methods: ['POST'])]
    public function checkout(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        // Validation
        if (empty($data['address']) || empty($data['paymentMethod'])) {
            return $this->json(['error' => 'Address and payment method are required'], 400);
        }

        $userId = Uuid::fromString('550e8400-e29b-41d4-a716-446655440000'); // Mocked JWT User

        try {
            $order = $this->checkoutService->processCheckout($userId, $data);
            
            return $this->json([
                'message' => 'Checkout successful',
                'orderId' => $order->getId(),
                'status' => $order->getStatus(),
                'total' => $order->getTotalPrice()
            ], 201);
            
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    #[Route('/{checkoutId}', methods: ['GET'])]
    public function getCheckoutStatus(string $checkoutId): JsonResponse
    {
        // In this flow, the checkoutId is essentially the orderId
        $order = OrderService::getOrder(Uuid::fromString($checkoutId));

        if (!$order) {
            return $this->json(['error' => 'Checkout session not found'], 404);
        }

        return $this->json($order);
    }
}