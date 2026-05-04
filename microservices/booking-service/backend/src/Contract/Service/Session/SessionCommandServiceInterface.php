<?php

declare(strict_types=1);

namespace App\Contract\Service\Session;

use App\DTO\Request\CreateSessionRequest;
use App\Entity\CourtSession;

interface SessionCommandServiceInterface
{
    public function createSession(CreateSessionRequest $dto, string $coachId): CourtSession;
}
