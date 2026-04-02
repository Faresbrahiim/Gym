<?php
namespace App\Service;

use App\Entity\Order;
use Symfony\Component\Uid\Uuid;

interface OrderServiceInterface
{
    public function createOrderFromCart(Uuid $userId): Order;
    public function getUserOrders(Uuid $userId): array;
    public function getOrder(Uuid $orderId): ?Order;
    public function cancelOrder(Uuid $orderId): void;
    //admin
    public function getAllOrders(): array;
public function updateOrderStatus(Uuid $orderId, string $newStatus): Order;

}