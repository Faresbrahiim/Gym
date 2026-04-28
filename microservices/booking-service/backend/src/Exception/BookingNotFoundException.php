<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class BookingNotFoundException extends AppException
{
    public function __construct()
    {
        parent::__construct('Booking not found.', Response::HTTP_NOT_FOUND);
    }
}
