<?php

namespace App\Service;

use App\Entity\Product;
use App\Repository\ProductRepository;
use Symfony\Component\Uid\Uuid;

class ProductService implements ProductServiceInterface
{
    public function __construct(
        private readonly ProductRepository $productRepository
    ) {}

    public function getAllProducts(): array
    {
        return $this->productRepository->findAll();
    }

    public function getProduct(Uuid $id): ?Product
    {
        return $this->productRepository->find($id);
    }

    public function searchProducts(string $name): array
    {
        return $this->productRepository->searchByName($name);
    }
}