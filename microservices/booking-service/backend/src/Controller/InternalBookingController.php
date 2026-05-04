<?php

declare(strict_types=1);

namespace App\Controller;

use App\Contract\Service\Booking\BookingCleanupServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/internal')]
final class InternalBookingController extends AbstractController
{
    public function __construct(
        private readonly BookingCleanupServiceInterface $bookingCleanupService,
    ) {}

    #[Route('/users/{userId}/bookings/cancel-future', methods: ['POST'])]
    public function cancelFutureBookings(string $userId): JsonResponse
    {
        $cancelledCount = $this->bookingCleanupService->cancelFutureBookingsForUser($userId);

        return $this->json([
            'cancelledCount' => $cancelledCount,
        ]);
    }
}
