<?php

namespace App\Service;

use App\Entity\Product;
use App\Repository\ProductRepository;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\HttpFoundation\File\UploadedFile;

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
    
    public function createProductDirect(
        string $name, 
        ?string $description, 
        string $price, 
        string $status,
        ?UploadedFile $image = null
    ): Product {
        $product = new Product();
        $product->setName($name);
        $product->setDescription($description);
        $product->setPrice($price);
        $product->setStatus($status);
        $product->setCreatedAt(new \DateTimeImmutable());
        
        if ($image) {
            if (!$image->isValid()) {
                throw new \InvalidArgumentException('Invalid image upload');
            }

            $tempPath = $image->getPathname();
            if ($tempPath === '' || !is_file($tempPath)) {
                throw new \InvalidArgumentException('Uploaded image file is not readable');
            }

            $imageContent = file_get_contents($tempPath);
            if ($imageContent === false) {
                throw new \RuntimeException('Failed to read uploaded image file');
            }

            $base64Image = base64_encode($imageContent);
            $product->setImageData($base64Image);
            
            $extension = $image->getClientOriginalExtension();
            $mimeType = match(strtolower($extension)) {
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                default => 'image/jpeg'
            };
            $product->setImageMimeType($mimeType);
            
            // Set imagePath so the frontend knows this product has an image
            $product->setImagePath('/api/store/admin/products/' . $product->getId() . '/image');
        }
        
        $this->productRepository->save($product, true);
        
        return $product;
    }

    // Fixed updateProduct method signature
    public function updateProduct(Uuid $id, string $name, ?string $description, string $price): Product
    {
        $product = $this->productRepository->find($id);
        if (!$product) throw new \Exception("Product not found");

        $product->setName($name);
        $product->setDescription($description);
        $product->setPrice($price);
        
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

        $allowedStatuses = ['AVAILABLE', 'OUT_OF_STOCK', 'ARCHIVED'];
        if (!in_array(strtoupper($status), $allowedStatuses)) {
            throw new \InvalidArgumentException("Invalid status. Allowed: " . implode(', ', $allowedStatuses));
        }

        $product->setStatus(strtoupper($status));
        $this->productRepository->save($product, true);

        return $product;
    }

    public function getProductImage(Uuid $id): ?array
    {
        $product = $this->productRepository->find($id);
        
        if (!$product || !$product->getImageData()) {
            return null;
        }
        
        return [
            'data' => $product->getImageData(),
            'mimeType' => $product->getImageMimeType() ?: 'image/jpeg'
        ];
    }
}