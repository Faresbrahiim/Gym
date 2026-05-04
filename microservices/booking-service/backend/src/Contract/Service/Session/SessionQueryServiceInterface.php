<?php

declare(strict_types=1);

namespace App\Contract\Service\Session;

interface SessionQueryServiceInterface
{
    /** @return array{items: array, total: int, acceptedCounts: array<string, int>} */
    public function getCoachSessions(string $coachId, int $page, int $pageSize): array;

    /** @return array{items: array, total: int, acceptedCounts: array<string, int>} */
    public function getMemberSessions(int $page, int $pageSize): array;
}
