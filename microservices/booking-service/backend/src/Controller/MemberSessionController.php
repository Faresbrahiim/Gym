<?php

declare(strict_types=1);

namespace App\Controller;

use App\Contract\Service\Booking\BookingQueryServiceInterface;
use App\Contract\Service\Booking\MemberBookingCommandServiceInterface;
use App\Contract\Service\MembershipEligibilityServiceInterface;
use App\Contract\Service\Session\SessionQueryServiceInterface;
use App\DTO\Response\BookingEligibilityResponse;
use App\Mapper\BookingMapper;
use App\Mapper\SessionMapper;
use App\Security\JwtUser;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
#[IsGranted('ROLE_MEMBER')]
final class MemberSessionController extends AbstractController
{
    public function __construct(
        private readonly SessionQueryServiceInterface $sessionQueryService,
        private readonly MemberBookingCommandServiceInterface $memberBookingCommandService,
        private readonly BookingQueryServiceInterface $bookingQueryService,
        private readonly MembershipEligibilityServiceInterface $membershipEligibilityService,
    ) {}

    #[Route('/sessions', methods: ['GET'])]
    public function listSessions(Request $request): JsonResponse
    {
        $page     = max(1, (int) $request->query->get('page', 1));
        $pageSize = min(50, max(1, (int) $request->query->get('pageSize', 20)));

        $data = $this->sessionQueryService->getMemberSessions($page, $pageSize);

        return $this->json(SessionMapper::toPagedResponse($data['items'], $data['total'], $page, $pageSize, $data['acceptedCounts']));
    }

    #[Route('/sessions/booking-eligibility', methods: ['GET'])]
    public function getBookingEligibility(): JsonResponse
    {
        $eligibility = $this->membershipEligibilityService->getBookingEligibility();

        return $this->json(new BookingEligibilityResponse(
            $eligibility->allowed,
            $eligibility->reason,
        ));
    }

    #[Route('/sessions/{id}/book', methods: ['POST'])]
    public function bookSession(string $id): JsonResponse
    {
        /** @var JwtUser $user */
        $user    = $this->getUser();
        $booking = $this->memberBookingCommandService->bookSession($id, $user->getUserId());

        return $this->json(BookingMapper::toMemberResponse($booking), Response::HTTP_CREATED);
    }

    #[Route('/me/bookings/{id}/cancel', methods: ['PUT'])]
    public function cancelBooking(string $id): JsonResponse
    {
        /** @var JwtUser $user */
        $user    = $this->getUser();
        $booking = $this->memberBookingCommandService->cancelBooking($id, $user->getUserId());

        return $this->json(BookingMapper::toMemberResponse($booking));
    }

    #[Route('/me/bookings', methods: ['GET'])]
    public function listMemberBookings(Request $request): JsonResponse
    {
        /** @var JwtUser $user */
        $user     = $this->getUser();
        $page     = max(1, (int) $request->query->get('page', 1));
        $pageSize = min(50, max(1, (int) $request->query->get('pageSize', 20)));

        $data = $this->bookingQueryService->getMemberBookings($user->getUserId(), $page, $pageSize);

        return $this->json(BookingMapper::toPagedMemberResponse($data['items'], $data['total'], $page, $pageSize));
    }
}
