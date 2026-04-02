<?php

namespace App\Service;

use App\Entity\Product;
use App\Repository\ProductRepository;
use Symfony\Component\Uid\Uuid;
use App\Dto\Product\ProductAdminRequestDto;

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
    
    public function createProduct(ProductAdminRequestDto $dto): Product
    {
        $product = new Product();
        $product->setName($dto->name);
        $product->setDescription($dto->description);
        $product->setPrice($dto->price);
     
        $product->setStatus($dto->status);

        $this->productRepository->save($product, true);
        return $product;
    }

    public function updateProduct(Uuid $id, ProductAdminRequestDto $dto): Product
    {
        $product = $this->productRepository->find($id);
        if (!$product) throw new \Exception("Product not found");

        $product->setName($dto->name);
        $product->setDescription($dto->description);
        $product->setPrice($dto->price);
        
        $this->productRepository->save($product, true);
        return $product;
    }

    public function deleteProduct(Uuid $id): void
    {
        $product = $this->productRepository->find($id);
        if ($product) {
            $this->productRepository->getEntityManager()->remove($product);
            $this->productRepository->getEntityManager()->flush();
        }
    }
    public function updateStatus(Uuid $id, string $status): Product
    {
        $product = $this->productRepository->find($id);
        
        if (!$product) {
            throw new \Exception("Product not found");
        }

        // Tu peux ajouter une petite validation ici
        $allowedStatuses = ['AVAILABLE', 'OUT_OF_STOCK', 'ARCHIVED'];
        if (!in_array(strtoupper($status), $allowedStatuses)) {
            throw new \InvalidArgumentException("Invalid status. Allowed: " . implode(', ', $allowedStatuses));
        }

        $product->setStatus(strtoupper($status));
        
        // On utilise notre méthode save du repository
        $this->productRepository->save($product, true);

        return $product;
    }
}