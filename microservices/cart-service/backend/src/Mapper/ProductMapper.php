<?php

namespace App\Mapper;

use App\Entity\Product;
use App\Dto\Product\ProductResponseDto;

class ProductMapper
{
    public static function mapToResponseDto(Product $product): array
    {
        return [
            'id' => $product->getId()->toRfc4122(),
            'name' => $product->getName(),
            'description' => $product->getDescription(),
            'price' => (float)$product->getPrice(),
            'stockQuantity' => $product->getStockQuantity(),
            'status' => $product->getStatus(),
            'createdAt' => $product->getCreatedAt()->format('c'),
            'updatedAt' => $product->getUpdatedAt()?->format('c'),
            'imagePath' => $product->getImageData() ? "/store/products/{$product->getId()->toRfc4122()}/image" : null,
        ];
    }

    public static function mapCollection(array $products): array
    {
        return array_map([self::class, 'mapToResponseDto'], $products);
    }
}
