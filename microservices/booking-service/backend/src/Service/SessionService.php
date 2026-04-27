<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\Request\CreateSessionRequest;
use App\Entity\CourtSession;
use App\Exception\SessionNotFoundException;
use App\Repository\CourtSessionRepository;
use Symfony\Component\Uid\Uuid;

final class SessionService
{
    public function __construct(
        private readonly CourtSessionRepository $sessionRepository,
        private readonly UserSummaryService $userSummaryService,
    ) {}

    public function createSession(CreateSessionRequest $dto, string $coachId): CourtSession
    {
        $startTime = new \DateTimeImmutable($dto->startTime);
        $endTime   = new \DateTimeImmutable($dto->endTime);

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

        return [
            'items' => $this->sessionRepository->findByCoachPaginated($coachUuid, $page, $pageSize),
            'total' => $this->sessionRepository->countByCoach($coachUuid),
        ];
    }

    /** @return array{items: CourtSession[], total: int} */
    public function getOpenSessions(int $page, int $pageSize): array
    {
        return [
            'items' => $this->sessionRepository->findOpenPaginated($page, $pageSize),
            'total' => $this->sessionRepository->countOpen(),
        ];
    }

    public function getSession(string $sessionId): CourtSession
    {
        $session = $this->sessionRepository->find(Uuid::fromString($sessionId));

        if ($session === null) {
            throw new SessionNotFoundException($sessionId);
        }

        return $session;
    }
}
