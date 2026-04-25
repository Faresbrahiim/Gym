<?php
// src/Controller/OrderController.php
namespace App\Controller;

use App\Service\OrderServiceInterface;
use App\Mapper\OrderMapper;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/orders')]
class OrderController extends AbstractController
{
    public function __construct(
        private OrderServiceInterface $orderService
    ) {}

    #[Route('', methods: ['POST'])]
    public function checkout(): JsonResponse
    {
        $userId = Uuid::fromString('550e8400-e29b-41d4-a716-446655440000'); // Mocked
        
        try {
            $order = $this->orderService->createOrderFromCart($userId);
            // Use Mapper here!
            return $this->json(OrderMapper::mapToResponseDto($order), 201);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    #[Route('', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $userId = Uuid::fromString('550e8400-e29b-41d4-a716-446655440000');
        $orders = $this->orderService->getUserOrders($userId);
        
        // Use Mapper for collection!
        return $this->json(OrderMapper::mapCollection($orders));
    }

    #[Route('/{orderId}', methods: ['GET'])]
    public function show(string $orderId): JsonResponse
    {
        $order = $this->orderService->getOrder(Uuid::fromString($orderId));
        
        if (!$order) {
            return $this->json(['error' => 'Order hidden in cave'], 404);
        }

        return $this->json(OrderMapper::mapToResponseDto($order));
    }

    #[Route('/{orderId}/cancel', methods: ['POST'])]
    public function cancel(string $orderId): JsonResponse
    {
        $this->orderService->cancelOrder(Uuid::fromString($orderId));
        return $this->json(['message' => 'Order dead now (cancelled)']);
    }
}