<?php

namespace App\Controller\Internal;

use App\Service\OrderServiceInterface;
use App\Security\JwtUserExtractor;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/internal/orders')]
class OrderPaymentController extends AbstractController
{
    public function __construct(
        private readonly OrderServiceInterface $orderService,
        private readonly JwtUserExtractor $jwtUserExtractor,
    ) {}

    #[Route('/{orderId}/payment-details', methods: ['GET'])]
    public function paymentDetails(Request $request, string $orderId): JsonResponse
    {
        try {
            $userId = $this->jwtUserExtractor->extractUserId($request);
            return $this->json(
                $this->orderService->getPaymentDetails($userId, Uuid::fromString($orderId))
            );
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }
}
