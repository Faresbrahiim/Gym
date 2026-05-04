<?php
namespace App\Dto\Product;

use Symfony\Component\Validator\Constraints as Assert;

class ProductRequestDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 255)]
        public readonly string $name,

        #[Assert\Length(max: 1000)]
        public readonly ?string $description,

        #[Assert\NotBlank]
        #[Assert\PositiveOrZero]
        public readonly string $price,

        #[Assert\PositiveOrZero]
        public readonly int $stockQuantity = 0,

        #[Assert\Choice(['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED'])]
        public readonly string $status = 'AVAILABLE',
        public readonly ?string $imagePath = null
    ) {}
}
