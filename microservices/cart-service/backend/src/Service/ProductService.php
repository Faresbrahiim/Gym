<?php
namespace App\Service;

use App\Entity\Product;
use App\Repository\ProductRepository;

class ProductService
{
    public function __construct(
        private ProductRepository $productRepository
    ) {}

    /**
     * @return Product[]
     */
    public function getAllProducts(): array
    {
        return $this->productRepository->findAll();
    }
    public function getProduct(int $id): ?Product
    {
        return $this->productRepository->find($id);
    }
    public function searchProducts(string $name): array
    {
        return $this->productRepository->findBy(['name' => $name]);
    }
}