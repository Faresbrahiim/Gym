<?php
namespace App\Service;

use App\Entity\Order;
use Symfony\Component\Uid\Uuid;

interface CheckoutServiceInterface
{
    public function processCheckout(Uuid $userId, array $checkoutData): Order;
}