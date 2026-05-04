<?php

declare(strict_types=1);

namespace App\Service\Booking;

use App\Contract\Service\Booking\BookingCleanupServiceInterface;
use App\Enum\BookingStatus;
use App\Repository\BookingRepository;
use Symfony\Component\Uid\Uuid;

final class BookingCleanupService implements BookingCleanupServiceInterface
{
    public function __construct(
        private readonly BookingRepository $bookingRepository,
    ) {}

    public function cancelFutureBookingsForUser(string $userId): int
    {
        $userUuid = Uuid::fromString($userId);
        $bookings = $this->bookingRepository->findFutureActiveByUser($userUuid, new \DateTimeImmutable());

        foreach ($bookings as $booking) {
            $booking->setStatus(BookingStatus::CANCELLED);
            $this->bookingRepository->save($booking, false);
        }

        if ($bookings !== []) {
            $this->bookingRepository->flush();
        }

        return count($bookings);
    }
}
