<?php

declare(strict_types=1);

namespace App\DTO\Response;

final readonly class BookingEligibilityResponse
{
    public function __construct(
        public bool $allowed,
        public ?string $reason,
    ) {}
}
