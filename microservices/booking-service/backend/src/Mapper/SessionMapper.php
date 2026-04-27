<?php

declare(strict_types=1);

namespace App\Mapper;

use App\DTO\Response\PagedResponse;
use App\DTO\Response\SessionResponse;
use App\Entity\CourtSession;

final class SessionMapper
{
    public static function toResponse(CourtSession $session): SessionResponse
    {
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
            status:                 $session->getStatus()->value,
            createdAt:              $session->getCreatedAt()->format(\DateTimeInterface::ATOM),
            updatedAt:              $session->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        );
    }

    /**
     * @param CourtSession[] $sessions
     * @return PagedResponse<SessionResponse>
     */
    public static function toPagedResponse(array $sessions, int $total, int $page, int $pageSize): PagedResponse
    {
        return new PagedResponse(
            items:      array_map(static fn (CourtSession $s): SessionResponse => self::toResponse($s), $sessions),
            total:      $total,
            page:       $page,
            pageSize:   $pageSize,
            totalPages: $total > 0 ? (int) ceil($total / $pageSize) : 0,
        );
    }
}
