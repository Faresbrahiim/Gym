<?php 
// src/Service/CartService.php
namespace App\Service;

use App\Entity\Cart;
use App\Entity\CartItem;
use App\Entity\Product;
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
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be greater than 0.');
        }

        $cart = $this->getOrCreateCart($userId);
        $product = $this->productRepository->find($productId);

        if (!$product) {
            throw new \Exception("Product not found");
        }

        $this->assertProductCanBePurchased($product);

        foreach ($cart->getItems() as $item) {
            if ($item->getProduct()->getId()->equals($productId)) {
                $nextQuantity = $item->getQuantity() + $quantity;
                $this->assertStockAvailable($product->getStockQuantity(), $nextQuantity);
                $item->setQuantity($nextQuantity);
                $this->cartRepository->getEntityManager()->flush();
                return;
            }
        }

        $this->assertStockAvailable($product->getStockQuantity(), $quantity);

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
            $product = $item->getProduct();
            $this->assertProductCanBePurchased($product);
            $this->assertStockAvailable($product->getStockQuantity(), $quantity);
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

    private function assertProductCanBePurchased(Product $product): void
    {
        if ($product->getStatus() === 'ARCHIVED') {
            throw new \RuntimeException('This product is no longer available.');
        }

        if ($product->getStockQuantity() <= 0 || $product->getStatus() === 'OUT_OF_STOCK') {
            throw new \RuntimeException('This product is out of stock.');
        }
    }

    private function assertStockAvailable(int $stockQuantity, int $requestedQuantity): void
    {
        if ($requestedQuantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be greater than 0.');
        }

        if ($requestedQuantity > $stockQuantity) {
            throw new \RuntimeException(sprintf(
                'Only %d item(s) left in stock.',
                $stockQuantity
            ));
        }
    }
}
