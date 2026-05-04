<?php

declare(strict_types=1);

namespace App\Contract\Service\Booking;

use App\Entity\Booking;

interface CoachBookingModerationServiceInterface
{
    public function acceptBooking(string $bookingId, string $coachId): Booking;

    public function declineBooking(string $bookingId, string $coachId): Booking;
}
