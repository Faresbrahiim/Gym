<?php

namespace App\Mapper;

use App\Dto\Product\ProductAdminRequestDto;

class ProductAdminMapper
{
    public static function mapToProductAdminRequestDto(array $data): ProductAdminRequestDto
    {
        return new ProductAdminRequestDto(
            name: $data['name'] ?? '',
            description: $data['description'] ?? null,
            price: (string)($data['price'] ?? 0),
            status: $data['status'] ?? 'AVAILABLE',
            image: $data['image'] ?? null  // This will be set from form data
        );
    }

}