<?php
// src/Dto/Cart/CartItemResponseDto.php
namespace App\Dto\Cart;

class CartItemResponseDto
{
    public function __construct(
        public readonly string $id,
        public readonly string $productId,
        public readonly string $productName,
        public readonly float $price,
        public readonly int $quantity,
        public readonly ?string $productImage = null,
        public readonly ?string $productDescription = null,
        public readonly ?string $productStatus = null,
    ) {}
}