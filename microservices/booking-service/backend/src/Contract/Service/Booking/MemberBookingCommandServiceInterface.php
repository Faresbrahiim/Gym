<?php

declare(strict_types=1);

namespace App\Contract\Service\Booking;

use App\Entity\Booking;

interface MemberBookingCommandServiceInterface
{
    public function bookSession(string $sessionId, string $userId): Booking;

    public function cancelBooking(string $bookingId, string $userId): Booking;
}
