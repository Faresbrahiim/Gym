<?php

declare(strict_types=1);

namespace App\Service\Booking;

use App\Contract\Service\Booking\CoachBookingModerationServiceInterface;
use App\Entity\Booking;
use App\Enum\BookingStatus;
use App\Exception\BookingNotFoundException;
use App\Exception\SessionFullException;
use App\Exception\UnauthorizedCoachException;
use App\Repository\BookingRepository;
use Symfony\Component\Uid\Uuid;

final class CoachBookingModerationService implements CoachBookingModerationServiceInterface
{
    public function __construct(
        private readonly BookingRepository $bookingRepository,
    ) {}

    public function acceptBooking(string $bookingId, string $coachId): Booking
    {
        $booking = $this->bookingRepository->findWithSession(Uuid::fromString($bookingId));
        if ($booking === null) {
            throw new BookingNotFoundException();
        }

        if (!$booking->getSession()->getCoachId()->equals(Uuid::fromString($coachId))) {
            throw new UnauthorizedCoachException();
        }

        if ($booking->getStatus() !== BookingStatus::PENDING) {
            throw new \DomainException('Only pending bookings can be accepted.');
        }

        $accepted = $this->bookingRepository->countAcceptedBySession($booking->getSession()->getId());
        if ($accepted >= $booking->getSession()->getMaxParticipants()) {
            throw new SessionFullException();
        }

        $booking->setStatus(BookingStatus::ACCEPTED);
        $this->bookingRepository->save($booking);

        return $booking;
    }

    public function declineBooking(string $bookingId, string $coachId): Booking
    {
        $booking = $this->bookingRepository->findWithSession(Uuid::fromString($bookingId));
        if ($booking === null) {
            throw new BookingNotFoundException();
        }

        if (!$booking->getSession()->getCoachId()->equals(Uuid::fromString($coachId))) {
            throw new UnauthorizedCoachException();
        }

        if ($booking->getStatus() !== BookingStatus::PENDING) {
            throw new \DomainException('Only pending bookings can be declined.');
        }

        $booking->setStatus(BookingStatus::DECLINED);
        $this->bookingRepository->save($booking);

        return $booking;
    }
}
