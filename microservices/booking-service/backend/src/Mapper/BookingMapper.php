<?php

declare(strict_types=1);

namespace App\Mapper;

use App\DTO\Response\CoachBookingResponse;
use App\DTO\Response\MemberBookingResponse;
use App\DTO\Response\PagedResponse;
use App\Entity\Booking;

final class BookingMapper
{
    public static function toCoachResponse(Booking $booking): CoachBookingResponse
    {
        return new CoachBookingResponse(
            id:                    $booking->getId()->toRfc4122(),
            sessionId:             $booking->getSession()->getId()->toRfc4122(),
            userId:                $booking->getUserId()->toRfc4122(),
            userFullName:          $booking->getUserFullName(),
            userProfilePictureUrl: $booking->getUserProfilePictureUrl(),
            status:                $booking->getStatus()->value,
            createdAt:             $booking->getCreatedAt()->format(\DateTimeInterface::ATOM),
            updatedAt:             $booking->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        );
    }

    public static function toMemberResponse(Booking $booking): MemberBookingResponse
    {
        $session = $booking->getSession();

        return new MemberBookingResponse(
            id:            $booking->getId()->toRfc4122(),
            sessionId:     $session->getId()->toRfc4122(),
            sessionTitle:  $session->getTitle(),
            coachFullName: $session->getCoachFullName(),
            startTime:     $session->getStartTime()->format(\DateTimeInterface::ATOM),
            endTime:       $session->getEndTime()->format(\DateTimeInterface::ATOM),
            status:        $booking->getStatus()->value,
            createdAt:     $booking->getCreatedAt()->format(\DateTimeInterface::ATOM),
            updatedAt:     $booking->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        );
    }

    /**
     * @param Booking[] $bookings
     * @return PagedResponse<CoachBookingResponse>
     */
    public static function toPagedCoachResponse(array $bookings, int $total, int $page, int $pageSize): PagedResponse
    {
        return new PagedResponse(
            items:      array_map(static fn (Booking $b): CoachBookingResponse => self::toCoachResponse($b), $bookings),
            total:      $total,
            page:       $page,
            pageSize:   $pageSize,
            totalPages: $total > 0 ? (int) ceil($total / $pageSize) : 0,
        );
    }

    /**
     * @param Booking[] $bookings
     * @return PagedResponse<MemberBookingResponse>
     */
    public static function toPagedMemberResponse(array $bookings, int $total, int $page, int $pageSize): PagedResponse
    {
        return new PagedResponse(
            items:      array_map(static fn (Booking $b): MemberBookingResponse => self::toMemberResponse($b), $bookings),
            total:      $total,
            page:       $page,
            pageSize:   $pageSize,
            totalPages: $total > 0 ? (int) ceil($total / $pageSize) : 0,
        );
    }
}
