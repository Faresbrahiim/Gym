<?php

namespace App\Service;

use App\Entity\Product;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\HttpFoundation\File\UploadedFile;

interface ProductServiceInterface
{
    public function getAllProducts(): array;
    public function getProduct(Uuid $id): ?Product;
    public function searchProducts(string $name): array;
    public function createProductDirect(
        string $name, 
        ?string $description, 
        string $price, 
        string $status,
        int $stockQuantity,
        ?UploadedFile $image = null
    ): Product;
    public function updateProduct(Uuid $id, string $name, ?string $description, string $price, string $status, int $stockQuantity): Product;
    public function deleteProduct(Uuid $id): void;
    public function updateStatus(Uuid $id, string $status): Product;
    public function getProductImage(Uuid $id): ?array;
}
