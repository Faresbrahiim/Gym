<?php
// src/Dto/Product/ProductAdminRequestDto.php
namespace App\Dto\Product;
use Symfony\Component\HttpFoundation\File\UploadedFile;  
class ProductAdminRequestDto
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $description,
        public readonly string $price,
        public readonly int $stockQuantity,
        public readonly string $status,
        public readonly ?UploadedFile $image = null  
    ) {}

}
