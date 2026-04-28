<?php

declare(strict_types=1);

namespace App\DTO\Response;

final readonly class MemberBookingResponse
{
    public function __construct(
        public string $id,
        public string $sessionId,
        public string $sessionTitle,
        public string $coachFullName,
        public string $startTime,
        public string $endTime,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
    ) {}
}
