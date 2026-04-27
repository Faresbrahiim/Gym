<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class BookingNotFoundException extends AppException
{
    public function __construct(string $bookingId)
    {
        parent::__construct(sprintf('Booking "%s" not found.', $bookingId), Response::HTTP_NOT_FOUND);
    }
}
