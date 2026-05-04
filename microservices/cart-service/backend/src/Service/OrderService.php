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
    private const STATUS_AVAILABLE = 'AVAILABLE';
    private const STATUS_OUT_OF_STOCK = 'OUT_OF_STOCK';
    private const STATUS_ARCHIVED = 'ARCHIVED';

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

            if ($product->getStatus() === 'ARCHIVED') {
                throw new \RuntimeException(sprintf('Product "%s" is no longer available.', $product->getName()));
            }

            if ($product->getStockQuantity() < $cartItem->getQuantity()) {
                throw new \RuntimeException(sprintf(
                    'Only %d item(s) left in stock for "%s".',
                    $product->getStockQuantity(),
                    $product->getName()
                ));
            }
            
            $orderItem = new OrderItem();
            $orderItem->setOrder($order);
            $orderItem->setProduct($product);
            $orderItem->setPrice($product->getPrice());
            $orderItem->setQuantity($cartItem->getQuantity());

            $order->addOrderItem($orderItem);
            $total += (float)$product->getPrice() * $cartItem->getQuantity();

            $product->setStockQuantity($product->getStockQuantity() - $cartItem->getQuantity());
            $product->setStatus($product->getStockQuantity() <= 0 ? self::STATUS_OUT_OF_STOCK : self::STATUS_AVAILABLE);
            
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
            $this->restoreStockForOrder($order);
            $order->setStatus(self::STATUS_CANCELLED);
            $this->orderRepository->save($order, true);
        }
    }

    public function cancelUserOrder(Uuid $userId, Uuid $orderId): void
    {
        $order = $this->getUserOrder($userId, $orderId);
        if ($order && $order->getStatus() === self::STATUS_PENDING_PAYMENT) {
            $this->restoreStockForOrder($order);
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
        return $this->transitionPaymentState($orderId, self::STATUS_PENDING_PAYMENT, self::STATUS_PAYMENT_FAILED, true);
    }

    public function markPaymentExpired(Uuid $orderId): ?Order
    {
        return $this->transitionPaymentState($orderId, self::STATUS_PENDING_PAYMENT, self::STATUS_PAYMENT_EXPIRED, true);
    }

    public function getAllOrders(): array
    {
        return $this->orderRepository->findBy([], ['createdAt' => 'DESC']);
    }

    public function updateOrderStatus(Uuid $orderId, string $newStatus): Order
    {
        $order = $this->orderRepository->find($orderId);
        if (!$order) throw new \Exception("Order lost in woods.");

        if ($newStatus === self::STATUS_CANCELLED && $order->getStatus() === self::STATUS_PENDING_PAYMENT) {
            $this->restoreStockForOrder($order);
        }

        $order->setStatus(strtoupper($newStatus));
        $this->orderRepository->save($order, true);

        return $order;
    }

    private function transitionPaymentState(
        Uuid $orderId,
        string $fromStatus,
        string $toStatus,
        bool $restoreStock = false
    ): ?Order
    {
        $order = $this->getOrder($orderId);

        if (!$order) {
            return null;
        }

        if ($order->getStatus() !== $fromStatus) {
            return $order;
        }

        if ($restoreStock) {
            $this->restoreStockForOrder($order);
        }

        $order->setStatus($toStatus);
        $this->orderRepository->save($order, true);

        return $order;
    }

    private function restoreStockForOrder(Order $order): void
    {
        foreach ($order->getOrderItems() as $orderItem) {
            $product = $orderItem->getProduct();
            $product->setStockQuantity($product->getStockQuantity() + $orderItem->getQuantity());

            if ($product->getStatus() !== self::STATUS_ARCHIVED && $product->getStockQuantity() > 0) {
                $product->setStatus(self::STATUS_AVAILABLE);
            }
        }
    }
}
