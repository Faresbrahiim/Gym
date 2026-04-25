<?php

namespace App\Mapper;

use App\Dto\Order\OrderItemResponseDto;
use App\Entity\Order;

class OrderMapper
{
    public static function mapToResponseDto(Order $order): array
    {
        $items = [];

        foreach ($order->getOrderItems() as $orderItem) {
            $product = $orderItem->getProduct();

            $items[] = new OrderItemResponseDto(
                $product->getId()->toRfc4122(),
                $product->getName(),
                $product->getPrice(),
                $orderItem->getQuantity(),
                $product->getImagePath()
            );
        }

        return [
            'id'          => $order->getId()->toRfc4122(),
            'userId'      => $order->getUserId()->toRfc4122(),
            'status'      => $order->getStatus(),
            'totalPrice'  => $order->getTotalPrice(),
            'items'       => $items,
            'createdAt'   => $order->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt'   => $order->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    public static function mapCollection(array $orders): array
    {
        return array_map(
            fn(Order $order) => self::mapToResponseDto($order),
            $orders
        );
    }
}