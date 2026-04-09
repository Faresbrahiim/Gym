<?php
// src/Mapper/OrderMapper.php
namespace App\Mapper;

use App\Entity\Order;
use App\Dto\Order\OrderResponseDto; // Create this DTO similar to Cart

class OrderMapper
{
    public static function mapToResponseDto(Order $order): array
    {
        // Simplification for brevity: follow the same logic as CartMapper
        return [
            'id' => $order->getId()->toRfc4122(),
            'status' => $order->getStatus(),
            'totalPrice' => $order->getTotalPrice(),
            'createdAt' => $order->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    public static function mapCollection(array $orders): array
    {
        return array_map(fn($o) => $this->mapToResponseDto($o), $orders);
    }
}