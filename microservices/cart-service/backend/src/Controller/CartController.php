<?php

namespace App\Controller;

use App\Mapper\CartMapper;
use App\Security\JwtUserExtractor;
use App\Service\CartServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/cart')]
class CartController extends AbstractController
{
    public function __construct(
        private readonly CartServiceInterface $cartService,
        private readonly JwtUserExtractor $jwtUserExtractor,
    ) {}

    #[Route('', methods: ['GET'])]
    public function getCart(Request $request): JsonResponse
    {
        $userId = $this->jwtUserExtractor->extractUserId($request);
        $cart   = $this->cartService->getOrCreateCart($userId);

        return $this->json(CartMapper::mapToResponseDto($cart));
    }

    #[Route('/items', methods: ['POST'])]
    public function addItem(Request $request): JsonResponse
    {
        $data   = json_decode($request->getContent(), true);
        $userId = $this->jwtUserExtractor->extractUserId($request);

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
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/items/{itemId}', methods: ['DELETE'])]
    public function removeItem(string $itemId): JsonResponse
    {
        $this->cartService->removeCartItem(Uuid::fromString($itemId));
        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('', methods: ['DELETE'])]
    public function clearCart(Request $request): JsonResponse
    {
        $userId = $this->jwtUserExtractor->extractUserId($request);
        $this->cartService->clearUserCart($userId);
        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
