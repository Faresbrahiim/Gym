<?php

declare(strict_types=1);

namespace App\DTO\Response;

final readonly class CoachBookingResponse
{
    public function __construct(
        public string $id,
        public string $sessionId,
        public string $userId,
        public string $userFullName,
        public string $userProfilePictureUrl,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
    ) {}
}
