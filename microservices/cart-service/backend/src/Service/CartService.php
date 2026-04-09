<?php 
// src/Service/CartService.php
namespace App\Service;

use App\Entity\Cart;
use App\Entity\CartItem;
use App\Repository\CartRepository;
use App\Repository\CartItemRepository;
use App\Repository\ProductRepository;
use Symfony\Component\Uid\Uuid;

class CartService implements CartServiceInterface
{
    public function __construct(
        private readonly CartRepository $cartRepository,
        private readonly CartItemRepository $cartItemRepository,
        private readonly ProductRepository $productRepository
    ) {}

    public function getOrCreateCart(Uuid $userId): Cart
    {
        $cart = $this->cartRepository->findOneBy(['userId' => $userId]);
        if (!$cart) {
            $cart = new Cart();
            $cart->setUserId($userId);
            $this->cartRepository->getEntityManager()->persist($cart);
            $this->cartRepository->getEntityManager()->flush();
        }
        return $cart;
    }

    public function addProductToCart(Uuid $userId, Uuid $productId, int $quantity): void
    {
        $cart = $this->getOrCreateCart($userId);
        $product = $this->productRepository->find($productId);

        if (!$product) {
            throw new \Exception("Product not found");
        }

        foreach ($cart->getItems() as $item) {
            if ($item->getProduct()->getId()->equals($productId)) {
                $item->setQuantity($item->getQuantity() + $quantity);
                $this->cartRepository->getEntityManager()->flush();
                return;
            }
        }

        $item = new CartItem();
        $item->setProduct($product);
        $item->setQuantity($quantity);
        $cart->addItem($item);

        $this->cartRepository->getEntityManager()->persist($item);
        $this->cartRepository->getEntityManager()->flush();
    }

    public function updateItemQuantity(Uuid $itemId, int $quantity): void
    {
        $item = $this->cartItemRepository->find($itemId);
        if ($item) {
            $item->setQuantity($quantity);
            $this->cartRepository->getEntityManager()->flush();
        }
    }

    public function removeCartItem(Uuid $itemId): void
    {
        $item = $this->cartItemRepository->find($itemId);
        if ($item) {
            $this->cartRepository->getEntityManager()->remove($item);
            $this->cartRepository->getEntityManager()->flush();
        }
    }

    public function clearUserCart(Uuid $userId): void
    {
        $cart = $this->getOrCreateCart($userId);
        foreach ($cart->getItems() as $item) {
            $this->cartRepository->getEntityManager()->remove($item);
        }
        $this->cartRepository->getEntityManager()->flush();
    }
}