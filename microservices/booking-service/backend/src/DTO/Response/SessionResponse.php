<?php

declare(strict_types=1);

namespace App\DTO\Response;

final readonly class SessionResponse
{
    public function __construct(
        public string  $id,
        public string  $coachId,
        public string  $coachFullName,
        public string  $coachProfilePictureUrl,
        public string  $title,
        public ?string $description,
        public string  $startTime,
        public string  $endTime,
        public int     $maxParticipants,
        public string  $status,
        public string  $createdAt,
        public string  $updatedAt,
    ) {}
}
