<?php

declare(strict_types=1);

namespace App\DTO\External;

final readonly class BookingEligibilityDto
{
    public function __construct(
        public bool $allowed,
        public ?string $reason,
    ) {}
}
