<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class MembershipBookingNotAllowedException extends AppException
{
    public function __construct(string $message)
    {
        parent::__construct($message, Response::HTTP_FORBIDDEN);
    }
}
