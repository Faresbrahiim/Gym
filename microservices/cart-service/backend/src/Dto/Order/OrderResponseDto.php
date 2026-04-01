<?php
namespace App\Dto\Order;

final class OrderResponseDto
{
    /** @param OrderItemResponseDto[] $items */
    public function __construct(
        public readonly string $id,
        public readonly string $status,
        public readonly string $totalPrice,
        public readonly string $createdAt,
        public readonly array $items
    ) {}
}