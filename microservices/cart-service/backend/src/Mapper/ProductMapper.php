<?php
// src/Mapper/ProductMapper.php
namespace App\Mapper;
use App\Entity\Product;
use App\Dto\Product\ProductResponseDto;
class ProductMapper
{
    /**
     * Map a single Entity to a DTO
     */
    public static function mapToResponseDto(Product $product): ProductResponseDto
    {
        return new ProductResponseDto(
            id: $product->getId()->toRfc4122(),
            name: $product->getName(),
            description: $product->getDescription(),
            price: $product->getPrice(),
            status: $product->getStatus(),
            createdAt: $product->getCreatedAt()->format(\DateTimeInterface::ATOM)
        );
    }

    /**
     * Map an array of Entities to an array of DTOs
     * @param Product[] $products
     * @return ProductResponseDto[]
     */
    public static function mapCollection(array $products): array
    {
        return array_map(
            fn(Product $product) => $this->mapToResponseDto($product),
            $products
        );
    }
}