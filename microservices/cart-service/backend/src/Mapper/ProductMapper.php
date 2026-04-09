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
    public static function mapToRseponseDto(Product $product): ProductResponseDto
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
    public static function mapCollection(array $products): array
    {
        // On utilise self:: car on est dans un contexte statique
        return array_map([self::class, 'mapToRseponseDto'], $products);
    }
}