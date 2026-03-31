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
        private readonly CartServiceInterface $cartService // Dependency Inversion
    ) {}

    public function createOrderFromCart(Uuid $userId): Order
    {
        // 1. Get the current cart
        $cart = $this->cartService->getOrCreateCart($userId);
        
        if ($cart->getItems()->isEmpty()) {
            throw new \Exception("Cannot create an order from an empty cart.");
        }

        // 2. Initialize Order
        $order = new Order();
        $order->setUserId($userId);
        $order->setStatus('PENDING');
        $total = 0;

        // 3. Transform CartItems to OrderItems (Snapshotting)
        foreach ($cart->getItems() as $cartItem) {
            $product = $cartItem->getProduct();
            
            $orderItem = new OrderItem();
            $orderItem->setOrder($order);
            $orderItem->setProductId($product->getId());
            $orderItem->setProductName($product->getName());
            $orderItem->setPrice($product->getPrice()); // Freeze the price!
            $orderItem->setQuantity($cartItem->getQuantity());

            $order->addOrderItem($orderItem);
            $total += (float)$product->getPrice() * $cartItem->getQuantity();
            
            // Persist each item
            $this->orderRepository->getEntityManager()->persist($orderItem);
        }

        $order->setTotalPrice((string)number_format($total, 2, '.', ''));
        
        // 4. Save Order
        $this->orderRepository->save($order, true);

        // 5. Clear the Cart (Delegating responsibility)
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
}