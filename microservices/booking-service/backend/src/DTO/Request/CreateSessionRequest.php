<?php

declare(strict_types=1);

namespace App\DTO\Request;

use Symfony\Component\Validator\Constraints as Assert;

final class CreateSessionRequest
{
    #[Assert\NotBlank(message: 'Title is required.')]
    #[Assert\Length(max: 255, maxMessage: 'Title cannot exceed 255 characters.')]
    public string $title = '';

    #[Assert\Length(max: 2000, maxMessage: 'Description cannot exceed 2000 characters.')]
    public ?string $description = null;

    #[Assert\NotBlank(message: 'Start time is required.')]
    public string $startTime = '';

    #[Assert\NotBlank(message: 'End time is required.')]
    public string $endTime = '';

    #[Assert\NotNull(message: 'Max participants is required.')]
    #[Assert\Positive(message: 'Max participants must be at least 1.')]
    #[Assert\LessThanOrEqual(value: 100, message: 'Max participants cannot exceed 100.')]
    public int $maxParticipants = 0;
}
