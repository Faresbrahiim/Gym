<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class DuplicateBookingException extends AppException
{
    public function __construct()
    {
        parent::__construct('You already have an active booking for this session.', Response::HTTP_CONFLICT);
    }
}
