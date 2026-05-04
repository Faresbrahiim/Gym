<?php

declare(strict_types=1);

namespace App\Service\Session;

use App\Contract\Service\Session\SessionCommandServiceInterface;
use App\Contract\Service\UserSummaryServiceInterface;
use App\DTO\Request\CreateSessionRequest;
use App\Entity\CourtSession;
use App\Exception\InvalidSessionTimeException;
use App\Repository\CourtSessionRepository;
use Symfony\Component\Uid\Uuid;

final class SessionCommandService implements SessionCommandServiceInterface
{
    public function __construct(
        private readonly CourtSessionRepository $sessionRepository,
        private readonly UserSummaryServiceInterface $userSummaryService,
    ) {}

    public function createSession(CreateSessionRequest $dto, string $coachId): CourtSession
    {
        $startTime = new \DateTimeImmutable($dto->startTime);
        $endTime = new \DateTimeImmutable($dto->endTime);

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
}
