<?php

declare(strict_types=1);

namespace App\Contract\Service\Booking;

interface BookingCleanupServiceInterface
{
    public function cancelFutureBookingsForUser(string $userId): int;
}
