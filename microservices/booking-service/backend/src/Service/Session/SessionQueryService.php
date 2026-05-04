<?php

declare(strict_types=1);

namespace App\Service\Session;

use App\Contract\Service\Session\SessionQueryServiceInterface;
use App\Entity\CourtSession;
use App\Repository\BookingRepository;
use App\Repository\CourtSessionRepository;
use Symfony\Component\Uid\Uuid;

final class SessionQueryService implements SessionQueryServiceInterface
{
    public function __construct(
        private readonly CourtSessionRepository $sessionRepository,
        private readonly BookingRepository $bookingRepository,
    ) {}

    /** @return array{items: CourtSession[], total: int, acceptedCounts: array<string, int>} */
    public function getCoachSessions(string $coachId, int $page, int $pageSize): array
    {
        $coachUuid = Uuid::fromString($coachId);
        $now = new \DateTimeImmutable();
        $items = $this->sessionRepository->findByCoachPaginated($coachUuid, $page, $pageSize, $now);

        return [
            'items' => $items,
            'total' => $this->sessionRepository->countByCoach($coachUuid, $now),
            'acceptedCounts' => $this->getAcceptedCounts($items),
        ];
    }

    /** @return array{items: CourtSession[], total: int, acceptedCounts: array<string, int>} */
    public function getMemberSessions(int $page, int $pageSize): array
    {
        $now = new \DateTimeImmutable();
        $items = $this->sessionRepository->findAllPaginated($page, $pageSize, $now);

        return [
            'items' => $items,
            'total' => $this->sessionRepository->countAll($now),
            'acceptedCounts' => $this->getAcceptedCounts($items),
        ];
    }

    /**
     * @param CourtSession[] $sessions
     * @return array<string, int>
     */
    private function getAcceptedCounts(array $sessions): array
    {
        $sessionIds = array_values(array_filter(
            array_map(
                static fn (CourtSession $session): ?Uuid => $session->getId(),
                $sessions
            )
        ));

        return $this->bookingRepository->countAcceptedBySessionIds($sessionIds);
    }
}
