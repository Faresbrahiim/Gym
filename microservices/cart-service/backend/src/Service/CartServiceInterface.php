<?php
// src/Service/CartServiceInterface.php
namespace App\Service;

use App\Entity\Cart;
use Symfony\Component\Uid\Uuid;

interface CartServiceInterface
{
    public function getOrCreateCart(Uuid $userId): Cart;
    public function addProductToCart(Uuid $userId, Uuid $productId, int $quantity): void;
    public function updateItemQuantity(Uuid $itemId, int $quantity): void;
    public function removeCartItem(Uuid $itemId): void;
    public function clearUserCart(Uuid $userId): void;
}