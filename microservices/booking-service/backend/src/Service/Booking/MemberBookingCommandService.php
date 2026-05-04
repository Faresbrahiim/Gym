<?php

declare(strict_types=1);

namespace App\Service\Booking;

use App\Contract\Service\Booking\MemberBookingCommandServiceInterface;
use App\Contract\Service\MembershipEligibilityServiceInterface;
use App\Contract\Service\UserSummaryServiceInterface;
use App\Entity\Booking;
use App\Enum\BookingStatus;
use App\Enum\SessionStatus;
use App\Exception\BookingCancellationNotAllowedException;
use App\Exception\BookingNotFoundException;
use App\Exception\DuplicateBookingException;
use App\Exception\MembershipBookingNotAllowedException;
use App\Exception\SessionFullException;
use App\Exception\SessionNotAvailableException;
use App\Exception\SessionNotFoundException;
use App\Repository\BookingRepository;
use App\Repository\CourtSessionRepository;
use Symfony\Component\Uid\Uuid;

final class MemberBookingCommandService implements MemberBookingCommandServiceInterface
{
    public function __construct(
        private readonly BookingRepository $bookingRepository,
        private readonly CourtSessionRepository $sessionRepository,
        private readonly UserSummaryServiceInterface $userSummaryService,
        private readonly MembershipEligibilityServiceInterface $membershipEligibilityService,
    ) {}

    public function bookSession(string $sessionId, string $userId): Booking
    {
        $sessionUuid = Uuid::fromString($sessionId);
        $userUuid = Uuid::fromString($userId);

        $session = $this->sessionRepository->find($sessionUuid);
        if ($session === null) {
            throw new SessionNotFoundException();
        }

        if ($session->getStatus() !== SessionStatus::OPEN) {
            throw new SessionNotAvailableException();
        }

        $existingBooking = $this->bookingRepository->findBySessionAndUser($sessionUuid, $userUuid);
        if ($existingBooking !== null && \in_array($existingBooking->getStatus(), [BookingStatus::PENDING, BookingStatus::ACCEPTED], true)) {
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

        if ($existingBooking !== null) {
            $existingBooking
                ->setStatus(BookingStatus::PENDING)
                ->setUserFullName($member->fullName)
                ->setUserProfilePictureUrl($member->profilePictureUrl);

            $this->bookingRepository->save($existingBooking);

            return $existingBooking;
        }

        $booking = (new Booking())
            ->setSession($session)
            ->setUserId($userUuid)
            ->setUserFullName($member->fullName)
            ->setUserProfilePictureUrl($member->profilePictureUrl);

        $this->bookingRepository->save($booking);

        return $booking;
    }

    public function cancelBooking(string $bookingId, string $userId): Booking
    {
        $booking = $this->bookingRepository->findWithSession(Uuid::fromString($bookingId));
        $userUuid = Uuid::fromString($userId);

        if ($booking === null || !$booking->getUserId()->equals($userUuid)) {
            throw new BookingNotFoundException();
        }

        if (!\in_array($booking->getStatus(), [BookingStatus::PENDING, BookingStatus::ACCEPTED], true)) {
            throw new BookingCancellationNotAllowedException('Only pending or accepted bookings can be cancelled.');
        }

        if ($booking->getSession()->getStartTime() <= new \DateTimeImmutable()) {
            throw new BookingCancellationNotAllowedException('You can only cancel bookings for future sessions.');
        }

        $booking->setStatus(BookingStatus::CANCELLED);
        $this->bookingRepository->save($booking);

        return $booking;
    }
}
