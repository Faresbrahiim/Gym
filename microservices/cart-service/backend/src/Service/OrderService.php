<?php
// src/Service/OrderService.php
namespace App\Service;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Repository\OrderRepository;
use Symfony\Component\Uid\Uuid;

class OrderService implements OrderServiceInterface
{
    private const STATUS_PENDING_PAYMENT = 'PENDING_PAYMENT';
    private const STATUS_PROCESSING = 'PROCESSING';
    private const STATUS_PAYMENT_FAILED = 'PAYMENT_FAILED';
    private const STATUS_PAYMENT_EXPIRED = 'PAYMENT_EXPIRED';
    private const STATUS_CANCELLED = 'CANCELLED';

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
        $order->setStatus(self::STATUS_PENDING_PAYMENT);
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

    public function getUserOrder(Uuid $userId, Uuid $orderId): ?Order
    {
        return $this->orderRepository->findOneByIdAndUserId($orderId, $userId);
    }

    public function cancelOrder(Uuid $orderId): void
    {
        $order = $this->getOrder($orderId);
        if ($order && $order->getStatus() === self::STATUS_PENDING_PAYMENT) {
            $order->setStatus(self::STATUS_CANCELLED);
            $this->orderRepository->save($order, true);
        }
    }

    public function cancelUserOrder(Uuid $userId, Uuid $orderId): void
    {
        $order = $this->getUserOrder($userId, $orderId);
        if ($order && $order->getStatus() === self::STATUS_PENDING_PAYMENT) {
            $order->setStatus(self::STATUS_CANCELLED);
            $this->orderRepository->save($order, true);
        }
    }

    public function getPaymentDetails(Uuid $userId, Uuid $orderId): array
    {
        $order = $this->getUserOrder($userId, $orderId);

        if (!$order) {
            throw new \RuntimeException('Order not found');
        }

        if ($order->getStatus() !== self::STATUS_PENDING_PAYMENT) {
            throw new \RuntimeException('Order is not awaiting payment');
        }

        return [
            'orderId' => $order->getId()?->toRfc4122(),
            'userId' => $order->getUserId()?->toRfc4122(),
            'totalAmount' => $order->getTotalPrice(),
            'currency' => 'USD',
        ];
    }

    public function markPaymentCompleted(Uuid $orderId): ?Order
    {
        return $this->transitionPaymentState($orderId, self::STATUS_PENDING_PAYMENT, self::STATUS_PROCESSING);
    }

    public function markPaymentFailed(Uuid $orderId): ?Order
    {
        return $this->transitionPaymentState($orderId, self::STATUS_PENDING_PAYMENT, self::STATUS_PAYMENT_FAILED);
    }

    public function markPaymentExpired(Uuid $orderId): ?Order
    {
        return $this->transitionPaymentState($orderId, self::STATUS_PENDING_PAYMENT, self::STATUS_PAYMENT_EXPIRED);
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

    private function transitionPaymentState(Uuid $orderId, string $fromStatus, string $toStatus): ?Order
    {
        $order = $this->getOrder($orderId);

        if (!$order) {
            return null;
        }

        if ($order->getStatus() !== $fromStatus) {
            return $order;
        }

        $order->setStatus($toStatus);
        $this->orderRepository->save($order, true);

        return $order;
    }
}
