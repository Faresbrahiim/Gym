<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\Response\BookingEligibilityResponse;
use App\Mapper\BookingMapper;
use App\Mapper\SessionMapper;
use App\Security\JwtUser;
use App\Service\BookingService;
use App\Service\MembershipEligibilityService;
use App\Service\SessionService;
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
        private readonly SessionService $sessionService,
        private readonly BookingService $bookingService,
        private readonly MembershipEligibilityService $membershipEligibilityService,
    ) {}

    #[Route('/sessions', methods: ['GET'])]
    public function listSessions(Request $request): JsonResponse
    {
        $page     = max(1, (int) $request->query->get('page', 1));
        $pageSize = min(50, max(1, (int) $request->query->get('pageSize', 20)));

        $data = $this->sessionService->getMemberSessions($page, $pageSize);

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
        $booking = $this->bookingService->bookSession($id, $user->getUserId());

        return $this->json(BookingMapper::toMemberResponse($booking), Response::HTTP_CREATED);
    }

    #[Route('/me/bookings', methods: ['GET'])]
    public function listMemberBookings(Request $request): JsonResponse
    {
        /** @var JwtUser $user */
        $user     = $this->getUser();
        $page     = max(1, (int) $request->query->get('page', 1));
        $pageSize = min(50, max(1, (int) $request->query->get('pageSize', 20)));

        $data = $this->bookingService->getMemberBookings($user->getUserId(), $page, $pageSize);

        return $this->json(BookingMapper::toPagedMemberResponse($data['items'], $data['total'], $page, $pageSize));
    }
}
