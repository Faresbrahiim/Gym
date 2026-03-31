<?php

namespace App\Service;

use App\Entity\Product;
use Symfony\Component\Uid\Uuid;

interface ProductServiceInterface
{
    /** @return Product[] */
    public function getAllProducts(): array;

    public function getProduct(Uuid $id): ?Product;

    /** @return Product[] */
    public function searchProducts(string $name): array;
}