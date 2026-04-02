<?php
namespace App\Controller\Admin;

use App\Mapper\OrderMapper;
use App\Service\OrderServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/store/admin/orders')]
class OrderAdminController extends AbstractController
{
    public function __construct(
        private readonly OrderServiceInterface $orderService,
        private readonly OrderMapper $orderMapper
    ) {}

    #[Route('', methods: ['GET'])]
    public function listAll(): JsonResponse
    {
        $orders = $this->orderService->getAllOrders();
        return $this->json(OrderMapper::mapCollection($orders));
    }

    #[Route('/{orderId}', methods: ['GET'])]
    public function getOne(string $orderId): JsonResponse
    {
        $order = $this->orderService->getOrder(Uuid::fromString($orderId));
        if (!$order) {
            return $this->json(['error' => 'Order not found'], Response::HTTP_NOT_FOUND);
        }
        return $this->json(OrderMapper::mapToResponseDto($order));
    }

    #[Route('/{orderId}/status', methods: ['PATCH'])]
    public function updateStatus(string $orderId, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['status'])) {
            return $this->json(['error' => 'Status field is required'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $order = $this->orderService->updateOrderStatus(
                Uuid::fromString($orderId), 
                $data['status']
            );
            return $this->json(OrderMapper::mapToResponseDto($order));
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }
}