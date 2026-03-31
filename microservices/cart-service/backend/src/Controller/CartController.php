<?php
// src/Controller/CartController.php
namespace App\Controller;

use App\Mapper\CartMapper;
use App\Service\CartServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/store/cart')]
class CartController extends AbstractController
{
    public function __construct(
        private readonly CartServiceInterface $cartService, // Interface Injection
        private readonly CartMapper $cartMapper            // Mapper Injection
    ) {}

    #[Route('', methods: ['GET'])]
    public function getCart(): JsonResponse
    {
        $userId = Uuid::fromString('550e8400-e29b-41d4-a716-446655440000');
        $cart = $this->cartService->getOrCreateCart($userId);

        // Map Entity to DTO
        return $this->json($this->cartMapper->mapToResponseDto($cart));
    }

    #[Route('/items', methods: ['POST'])]
    public function addItem(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $userId = Uuid::fromString('550e8400-e29b-41d4-a716-446655440000');

        try {
            $this->cartService->addProductToCart(
                $userId,
                Uuid::fromString($data['productId']),
                $data['quantity'] ?? 1
            );
            return $this->json(['message' => 'Item added'], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/items/{itemId}', methods: ['PUT'])]
    public function updateItem(string $itemId, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        try {
            $this->cartService->updateItemQuantity(Uuid::fromString($itemId), $data['quantity']);
            return $this->json(['message' => 'Quantity updated']);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => 'Invalid ID format'], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/items/{itemId}', methods: ['DELETE'])]
    public function removeItem(string $itemId): JsonResponse
    {
        $this->cartService->removeCartItem(Uuid::fromString($itemId));
        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('', methods: ['DELETE'])]
    public function clearCart(): JsonResponse
    {
        $userId = Uuid::fromString('550e8400-e29b-41d4-a716-446655440000');
        $this->cartService->clearUserCart($userId);
        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}