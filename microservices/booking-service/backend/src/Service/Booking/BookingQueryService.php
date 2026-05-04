<?php

declare(strict_types=1);

namespace App\Service\Booking;

use App\Contract\Service\Booking\BookingQueryServiceInterface;
use App\Repository\BookingRepository;
use App\Repository\CourtSessionRepository;
use App\Exception\SessionNotFoundException;
use App\Exception\UnauthorizedCoachException;
use Symfony\Component\Uid\Uuid;

final class BookingQueryService implements BookingQueryServiceInterface
{
    public function __construct(
        private readonly BookingRepository $bookingRepository,
        private readonly CourtSessionRepository $sessionRepository,
    ) {}

    /** @return array{items: array, total: int} */
    public function getSessionBookings(string $sessionId, string $coachId, int $page, int $pageSize): array
    {
        $sessionUuid = Uuid::fromString($sessionId);
        $now = new \DateTimeImmutable();

        $session = $this->sessionRepository->find($sessionUuid);
        if ($session === null) {
            throw new SessionNotFoundException();
        }

        if (!$session->getCoachId()->equals(Uuid::fromString($coachId))) {
            throw new UnauthorizedCoachException();
        }

        return [
            'items' => $this->bookingRepository->findBySessionPaginated($sessionUuid, $page, $pageSize, $now),
            'total' => $this->bookingRepository->countBySession($sessionUuid, $now),
        ];
    }

    /** @return array{items: array, total: int} */
    public function getMemberBookings(string $userId, int $page, int $pageSize): array
    {
        $userUuid = Uuid::fromString($userId);
        $now = new \DateTimeImmutable();

        return [
            'items' => $this->bookingRepository->findByUserPaginated($userUuid, $page, $pageSize, $now),
            'total' => $this->bookingRepository->countByUser($userUuid, $now),
        ];
    }
}
