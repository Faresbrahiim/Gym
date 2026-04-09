<?php

namespace App\Service;

use App\Entity\Product;
use Symfony\Component\Uid\Uuid;
use App\Dto\Product\ProductAdminRequestDto;
interface ProductServiceInterface
{
    /** @return Product[] */
    public function getAllProducts(): array;

    public function getProduct(Uuid $id): ?Product;

    /** @return Product[] */
    public function searchProducts(string $name): array;

    public function createProduct(ProductAdminRequestDto $dto): Product;
    public function updateProduct(Uuid $id, ProductAdminRequestDto $dto): Product;
    public function deleteProduct(Uuid $id): void;
    public function updateStatus(Uuid $id, string $status): Product;
}