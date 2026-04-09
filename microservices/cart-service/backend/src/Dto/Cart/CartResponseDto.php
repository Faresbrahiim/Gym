<?php
namespace App\Dto\Cart;

final class CartResponseDto
{
    /** @param CartItemResponseDto[] $items */
    public function __construct(
        public readonly string $id,
        public readonly array $items,
        public readonly string $totalPrice
    ) {}
}
