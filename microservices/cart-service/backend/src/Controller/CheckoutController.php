<?php

namespace App\Controller;

use App\Mapper\OrderMapper;
use App\Security\JwtUserExtractor;
use App\Service\CheckoutService;
use App\Service\OrderServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/checkout')]
class CheckoutController extends AbstractController
{
    public function __construct(
        private readonly CheckoutService $checkoutService,
        private readonly OrderServiceInterface $orderService,
        private readonly JwtUserExtractor $jwtUserExtractor,
    ) {}

    #[Route('', methods: ['POST'])]
    public function checkout(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['address']) || empty($data['paymentMethod'])) {
            return $this->json(['error' => 'Address and payment method are required'], 400);
        }

        $userId = $this->jwtUserExtractor->extractUserId($request);

        try {
            $order = $this->checkoutService->processCheckout($userId, $data);

            return $this->json([
                'message' => 'Checkout successful',
                'orderId' => $order->getId(),
                'status'  => $order->getStatus(),
                'total'   => $order->getTotalPrice(),
            ], 201);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    #[Route('/{checkoutId}', methods: ['GET'])]
    public function getCheckoutStatus(string $checkoutId): JsonResponse
    {
        $order = $this->orderService->getOrder(Uuid::fromString($checkoutId));

        if (!$order) {
            return $this->json(['error' => 'Checkout session not found'], 404);
        }

        return $this->json(OrderMapper::mapToResponseDto($order));
    }
}
