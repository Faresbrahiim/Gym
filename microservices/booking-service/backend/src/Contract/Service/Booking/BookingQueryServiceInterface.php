<?php

declare(strict_types=1);

namespace App\Contract\Service\Booking;

interface BookingQueryServiceInterface
{
    /** @return array{items: array, total: int} */
    public function getSessionBookings(string $sessionId, string $coachId, int $page, int $pageSize): array;

    /** @return array{items: array, total: int} */
    public function getMemberBookings(string $userId, int $page, int $pageSize): array;
}
