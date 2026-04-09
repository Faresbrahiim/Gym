<?php
// src/Dto/Product/ProductAdminRequestDto.php
namespace App\Dto\Product;

final class ProductAdminRequestDto
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $description,
        public readonly string $price,
        public readonly string $status = 'AVAILABLE'
    ) {}
    
}