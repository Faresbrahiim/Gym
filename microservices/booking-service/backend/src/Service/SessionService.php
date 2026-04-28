<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\Request\CreateSessionRequest;
use App\Entity\CourtSession;
use App\Exception\InvalidSessionTimeException;
use App\Exception\SessionNotFoundException;
use App\Repository\BookingRepository;
use App\Repository\CourtSessionRepository;
use Symfony\Component\Uid\Uuid;

final class SessionService
{
    public function __construct(
        private readonly CourtSessionRepository $sessionRepository,
        private readonly BookingRepository $bookingRepository,
        private readonly UserSummaryService $userSummaryService,
    ) {}

    public function createSession(CreateSessionRequest $dto, string $coachId): CourtSession
    {
        $startTime = new \DateTimeImmutable($dto->startTime);
        $endTime   = new \DateTimeImmutable($dto->endTime);

        if ($endTime <= $startTime) {
            throw new InvalidSessionTimeException();
        }

        $coach = $this->userSummaryService->getUserSummary($coachId);

        $session = (new CourtSession())
            ->setCoachId(Uuid::fromString($coachId))
            ->setCoachFullName($coach->fullName)
            ->setCoachProfilePictureUrl($coach->profilePictureUrl)
            ->setTitle($dto->title)
            ->setDescription($dto->description)
            ->setStartTime($startTime)
            ->setEndTime($endTime)
            ->setMaxParticipants($dto->maxParticipants);

        $this->sessionRepository->save($session);

        return $session;
    }

    /** @return array{items: CourtSession[], total: int} */
    public function getCoachSessions(string $coachId, int $page, int $pageSize): array
    {
        $coachUuid = Uuid::fromString($coachId);
        $items = $this->sessionRepository->findByCoachPaginated($coachUuid, $page, $pageSize);

        return [
            'items' => $items,
            'total' => $this->sessionRepository->countByCoach($coachUuid),
            'acceptedCounts' => $this->getAcceptedCounts($items),
        ];
    }

    /** @return array{items: CourtSession[], total: int, acceptedCounts: array<string, int>} */
    public function getMemberSessions(int $page, int $pageSize): array
    {
        $items = $this->sessionRepository->findAllPaginated($page, $pageSize);

        return [
            'items' => $items,
            'total' => $this->sessionRepository->countAll(),
            'acceptedCounts' => $this->getAcceptedCounts($items),
        ];
    }

    public function getSession(string $sessionId): CourtSession
    {
        $session = $this->sessionRepository->find(Uuid::fromString($sessionId));

        if ($session === null) {
            throw new SessionNotFoundException();
        }

        return $session;
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
