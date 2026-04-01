<?php
namespace App\Dto\Cart;

final class CartItemResponseDto
{
    public function __construct(
        public readonly string $id,
        public readonly string $productId,
        public readonly string $productName,
        public readonly string $price,
        public readonly int $quantity
    ) {}
}