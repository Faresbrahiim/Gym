<?php
namespace App\Service;

use App\Entity\Order;
use Symfony\Component\Uid\Uuid;

interface OrderServiceInterface
{
    public function createOrderFromCart(Uuid $userId): Order;
    public function getUserOrders(Uuid $userId): array;
    public function getOrder(Uuid $orderId): ?Order;
    public function getUserOrder(Uuid $userId, Uuid $orderId): ?Order;
    public function cancelOrder(Uuid $orderId): void;
    public function cancelUserOrder(Uuid $userId, Uuid $orderId): void;
    public function getPaymentDetails(Uuid $userId, Uuid $orderId): array;
    public function markPaymentCompleted(Uuid $orderId): ?Order;
    public function markPaymentFailed(Uuid $orderId): ?Order;
    public function markPaymentExpired(Uuid $orderId): ?Order;
    //admin
    public function getAllOrders(): array;
    public function updateOrderStatus(Uuid $orderId, string $newStatus): Order;

}
