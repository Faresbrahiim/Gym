<?php
namespace App\Dto\Product;

use App\Entity\Product;

class ProductResponseDto
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly ?string $description,
        public readonly string $price,
        public readonly string $status,
        public readonly string $createdAt
    ) {}

    public static function fromEntity(Product $product): self
    {
        return new self(
            $product->getId()->toRfc4122(),
            $product->getName(),
            $product->getDescription(),
            $product->getPrice(),
            $product->getStatus(),
            $product->getCreatedAt()->format(\DateTimeInterface::ATOM)
        );
    }
    /**
     * SRP: Dedicated logic for mapping collections
     * @param Product[] $products
     * @return self[]
     */
    public static function fromEntities(array $products): array
    {
        return array_map(fn(Product $product) => self::fromEntity($product), $products);
    }
}