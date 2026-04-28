<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Booking;
use App\Enum\BookingStatus;
use App\Enum\SessionStatus;
use App\Exception\BookingNotFoundException;
use App\Exception\DuplicateBookingException;
use App\Exception\MembershipBookingNotAllowedException;
use App\Exception\SessionFullException;
use App\Exception\SessionNotAvailableException;
use App\Exception\SessionNotFoundException;
use App\Exception\UnauthorizedCoachException;
use App\Repository\BookingRepository;
use App\Repository\CourtSessionRepository;
use Symfony\Component\Uid\Uuid;

final class BookingService
{
    public function __construct(
        private readonly BookingRepository $bookingRepository,
        private readonly CourtSessionRepository $sessionRepository,
        private readonly UserSummaryService $userSummaryService,
        private readonly MembershipEligibilityService $membershipEligibilityService,
    ) {}

    public function bookSession(string $sessionId, string $userId): Booking
    {
        $sessionUuid = Uuid::fromString($sessionId);
        $userUuid    = Uuid::fromString($userId);

        $session = $this->sessionRepository->find($sessionUuid);
        if ($session === null) {
            throw new SessionNotFoundException();
        }

        if ($session->getStatus() !== SessionStatus::OPEN) {
            throw new SessionNotAvailableException();
        }

        if ($this->bookingRepository->findBySessionAndUser($sessionUuid, $userUuid) !== null) {
            throw new DuplicateBookingException();
        }

        $eligibility = $this->membershipEligibilityService->getBookingEligibility();
        if (!$eligibility->allowed) {
            throw new MembershipBookingNotAllowedException(
                $eligibility->reason ?? 'Your current membership plan does not include coach session booking.'
            );
        }

        $accepted = $this->bookingRepository->countAcceptedBySession($sessionUuid);
        if ($accepted >= $session->getMaxParticipants()) {
            throw new SessionFullException();
        }

        $member = $this->userSummaryService->getUserSummary($userId);

        $booking = (new Booking())
            ->setSession($session)
            ->setUserId($userUuid)
            ->setUserFullName($member->fullName)
            ->setUserProfilePictureUrl($member->profilePictureUrl);

        $this->bookingRepository->save($booking);

        return $booking;
    }

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

        $accepted = $this->bookingRepository->countAcceptedBySession(
            $booking->getSession()->getId(),
        );
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

    /** @return array{items: Booking[], total: int} */
    public function getSessionBookings(string $sessionId, string $coachId, int $page, int $pageSize): array
    {
        $sessionUuid = Uuid::fromString($sessionId);

        $session = $this->sessionRepository->find($sessionUuid);
        if ($session === null) {
            throw new SessionNotFoundException();
        }

        if (!$session->getCoachId()->equals(Uuid::fromString($coachId))) {
            throw new UnauthorizedCoachException();
        }

        return [
            'items' => $this->bookingRepository->findBySessionPaginated($sessionUuid, $page, $pageSize),
            'total' => $this->bookingRepository->countBySession($sessionUuid),
        ];
    }

    /** @return array{items: Booking[], total: int} */
    public function getMemberBookings(string $userId, int $page, int $pageSize): array
    {
        $userUuid = Uuid::fromString($userId);

        return [
            'items' => $this->bookingRepository->findByUserPaginated($userUuid, $page, $pageSize),
            'total' => $this->bookingRepository->countByUser($userUuid),
        ];
    }
}
