<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class DuplicateBookingException extends AppException
{
    public function __construct()
    {
        parent::__construct('You cannot book the same session more than once.', Response::HTTP_CONFLICT);
    }
}
