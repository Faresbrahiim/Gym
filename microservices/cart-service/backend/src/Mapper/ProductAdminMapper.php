<?php

namespace App\Mapper;

use App\Dto\Product\ProductAdminRequestDto;

class ProductAdminMapper
{
    /**
     * Convertit un tableau de données (souvent venant du JSON) en un DTO propre.
     */
    public static function mapToProductAdminRequestDto(array $data): ProductAdminRequestDto
    {
        // On instancie le DTO, pas "self" (le mapper) !
        return new ProductAdminRequestDto(
            $data['name'] ?? '',
            $data['description'] ?? null,
            (string)($data['price'] ?? '0.00'),
            $data['status'] ?? 'AVAILABLE'
        );
    }
}