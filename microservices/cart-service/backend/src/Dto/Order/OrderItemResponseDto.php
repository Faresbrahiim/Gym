<?php
namespace App\Dto\Order;

final class OrderItemResponseDto
{
    public function __construct(
        public readonly string $productId,
        public readonly string $productName,
        public readonly string $price,
        public readonly int $quantity,
        public readonly ?string $image = null   // URL or path to product image
    ) {}
}