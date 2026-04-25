<?php

namespace App\Controller;

use App\Mapper\OrderMapper;
use App\Security\JwtUserExtractor;
use App\Service\OrderServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/orders')]
class OrderController extends AbstractController
{
    public function __construct(
        private readonly OrderServiceInterface $orderService,
        private readonly JwtUserExtractor $jwtUserExtractor,
    ) {}

    #[Route('', methods: ['POST'])]
    public function checkout(Request $request): JsonResponse
    {
        $userId = $this->jwtUserExtractor->extractUserId($request);

        try {
            $order = $this->orderService->createOrderFromCart($userId);
            return $this->json(OrderMapper::mapToResponseDto($order), 201);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    #[Route('', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $userId = $this->jwtUserExtractor->extractUserId($request);
        $orders = $this->orderService->getUserOrders($userId);

        return $this->json(OrderMapper::mapCollection($orders));
    }

    #[Route('/{orderId}', methods: ['GET'])]
    public function show(Request $request, string $orderId): JsonResponse
    {
        $userId = $this->jwtUserExtractor->extractUserId($request);
        $order = $this->orderService->getUserOrder($userId, Uuid::fromString($orderId));

        if (!$order) {
            return $this->json(['error' => 'Order not found'], 404);
        }

        return $this->json(OrderMapper::mapToResponseDto($order));
    }

    #[Route('/{orderId}/cancel', methods: ['POST'])]
    public function cancel(Request $request, string $orderId): JsonResponse
    {
        $userId = $this->jwtUserExtractor->extractUserId($request);
        $this->orderService->cancelUserOrder($userId, Uuid::fromString($orderId));
        return $this->json(['message' => 'Order cancelled']);
    }
}
