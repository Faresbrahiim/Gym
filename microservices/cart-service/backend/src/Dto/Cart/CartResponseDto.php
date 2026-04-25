<?php
// src/Dto/Cart/CartResponseDto.php
namespace App\Dto\Cart;

class CartResponseDto
{
    public function __construct(
        public readonly string $id,
        public readonly array $items,
        public readonly float $totalPrice,
    ) {}
}