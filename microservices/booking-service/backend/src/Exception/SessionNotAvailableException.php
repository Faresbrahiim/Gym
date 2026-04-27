<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class SessionNotAvailableException extends AppException
{
    public function __construct(string $sessionId)
    {
        parent::__construct(
            sprintf('Session "%s" is not available for booking.', $sessionId),
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
