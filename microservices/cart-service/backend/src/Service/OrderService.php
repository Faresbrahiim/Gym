<?php
// src/Service/OrderService.php
namespace App\Service;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Repository\OrderRepository;
use Symfony\Component\Uid\Uuid;

class OrderService implements OrderServiceInterface
{
    public function __construct(
        private readonly OrderRepository $orderRepository,
        private readonly CartServiceInterface $cartService
    ) {}

    public function createOrderFromCart(Uuid $userId): Order
    {
        $cart = $this->cartService->getOrCreateCart($userId);
        
        if ($cart->getItems()->isEmpty()) {
            throw new \Exception("Cart empty. No food for you.");
        }

        $order = new Order();
        $order->setUserId($userId);
        $order->setStatus('PENDING');
        $total = 0;

        foreach ($cart->getItems() as $cartItem) {
            $product = $cartItem->getProduct();
            
            $orderItem = new OrderItem();
            $orderItem->setOrder($order);
            $orderItem->setProductId($product->getId());
            $orderItem->setProductName($product->getName());
            $orderItem->setPrice($product->getPrice()); // Freeze price! Good!
            $orderItem->setQuantity($cartItem->getQuantity());

            $order->addOrderItem($orderItem);
            $total += (float)$product->getPrice() * $cartItem->getQuantity();
            
            $this->orderRepository->getEntityManager()->persist($orderItem);
        }

        $order->setTotalPrice((string)number_format($total, 2, '.', ''));
        $this->orderRepository->save($order, true);
        $this->cartService->clearUserCart($userId);

        return $order;
    }

    public function getUserOrders(Uuid $userId): array
    {
        return $this->orderRepository->findBy(['userId' => $userId], ['createdAt' => 'DESC']);
    }

    public function getOrder(Uuid $orderId): ?Order
    {
        return $this->orderRepository->find($orderId);
    }

    public function cancelOrder(Uuid $orderId): void
    {
        $order = $this->getOrder($orderId);
        if ($order && $order->getStatus() === 'PENDING') {
            $order->setStatus('CANCELLED');
            $this->orderRepository->save($order, true);
        }
    }

    public function getAllOrders(): array
    {
        return $this->orderRepository->findBy([], ['createdAt' => 'DESC']);
    }

    public function updateOrderStatus(Uuid $orderId, string $newStatus): Order
    {
        $order = $this->orderRepository->find($orderId);
        if (!$order) throw new \Exception("Order lost in woods.");

        $order->setStatus(strtoupper($newStatus));
        $this->orderRepository->save($order, true);

        return $order;
    }
}