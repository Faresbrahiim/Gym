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
        public readonly string $createdAt,
        public readonly ?string $imagePath = null,
        
    ) {}
}