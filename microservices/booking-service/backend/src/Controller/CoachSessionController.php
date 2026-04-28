<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\Request\CreateSessionRequest;
use App\Mapper\BookingMapper;
use App\Mapper\SessionMapper;
use App\Security\JwtUser;
use App\Service\BookingService;
use App\Service\SessionService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/coach')]
#[IsGranted('ROLE_COACH')]
final class CoachSessionController extends AbstractController
{
    public function __construct(
        private readonly SessionService $sessionService,
        private readonly BookingService $bookingService,
    ) {}

    #[Route('/sessions', methods: ['POST'])]
    public function createSession(#[MapRequestPayload] CreateSessionRequest $dto): JsonResponse
    {
        /** @var JwtUser $user */
        $user    = $this->getUser();
        $session = $this->sessionService->createSession($dto, $user->getUserId());

        return $this->json(SessionMapper::toResponse($session), Response::HTTP_CREATED);
    }

    #[Route('/sessions', methods: ['GET'])]
    public function listCoachSessions(Request $request): JsonResponse
    {
        /** @var JwtUser $user */
        $user     = $this->getUser();
        $page     = max(1, (int) $request->query->get('page', 1));
        $pageSize = min(50, max(1, (int) $request->query->get('pageSize', 20)));

        $data = $this->sessionService->getCoachSessions($user->getUserId(), $page, $pageSize);

        return $this->json(SessionMapper::toPagedResponse($data['items'], $data['total'], $page, $pageSize, $data['acceptedCounts']));
    }

    #[Route('/sessions/{id}/bookings', methods: ['GET'])]
    public function listSessionBookings(string $id, Request $request): JsonResponse
    {
        /** @var JwtUser $user */
        $user     = $this->getUser();
        $page     = max(1, (int) $request->query->get('page', 1));
        $pageSize = min(50, max(1, (int) $request->query->get('pageSize', 20)));

        $data = $this->bookingService->getSessionBookings($id, $user->getUserId(), $page, $pageSize);

        return $this->json(BookingMapper::toPagedCoachResponse($data['items'], $data['total'], $page, $pageSize));
    }

    #[Route('/bookings/{id}/accept', methods: ['PUT'])]
    public function acceptBooking(string $id): JsonResponse
    {
        /** @var JwtUser $user */
        $user    = $this->getUser();
        $booking = $this->bookingService->acceptBooking($id, $user->getUserId());

        return $this->json(BookingMapper::toCoachResponse($booking));
    }

    #[Route('/bookings/{id}/decline', methods: ['PUT'])]
    public function declineBooking(string $id): JsonResponse
    {
        /** @var JwtUser $user */
        $user    = $this->getUser();
        $booking = $this->bookingService->declineBooking($id, $user->getUserId());

        return $this->json(BookingMapper::toCoachResponse($booking));
    }
}
