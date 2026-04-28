<?php

declare(strict_types=1);

namespace App\Mapper;

use App\DTO\Response\PagedResponse;
use App\DTO\Response\SessionResponse;
use App\Entity\CourtSession;

final class SessionMapper
{
    public static function toResponse(CourtSession $session, int $acceptedParticipants = 0): SessionResponse
    {
        $remainingSeats = max(0, $session->getMaxParticipants() - $acceptedParticipants);

        return new SessionResponse(
            id:                     $session->getId()->toRfc4122(),
            coachId:                $session->getCoachId()->toRfc4122(),
            coachFullName:          $session->getCoachFullName(),
            coachProfilePictureUrl: $session->getCoachProfilePictureUrl(),
            title:                  $session->getTitle(),
            description:            $session->getDescription(),
            startTime:              $session->getStartTime()->format(\DateTimeInterface::ATOM),
            endTime:                $session->getEndTime()->format(\DateTimeInterface::ATOM),
            maxParticipants:        $session->getMaxParticipants(),
            acceptedParticipants:   $acceptedParticipants,
            remainingSeats:         $remainingSeats,
            isFull:                 $remainingSeats === 0,
            status:                 $session->getStatus()->value,
            createdAt:              $session->getCreatedAt()->format(\DateTimeInterface::ATOM),
            updatedAt:              $session->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        );
    }

    /**
     * @param CourtSession[] $sessions
     * @return PagedResponse<SessionResponse>
     */
    public static function toPagedResponse(array $sessions, int $total, int $page, int $pageSize, array $acceptedCounts = []): PagedResponse
    {
        return new PagedResponse(
            items:      array_map(
                static fn (CourtSession $s): SessionResponse => self::toResponse(
                    $s,
                    $acceptedCounts[$s->getId()?->toRfc4122() ?? ''] ?? 0
                ),
                $sessions
            ),
            total:      $total,
            page:       $page,
            pageSize:   $pageSize,
            totalPages: $total > 0 ? (int) ceil($total / $pageSize) : 0,
        );
    }
}
