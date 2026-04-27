<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class SessionFullException extends AppException
{
    public function __construct(string $sessionId)
    {
        parent::__construct(
            sprintf('Session "%s" has reached its maximum number of participants.', $sessionId),
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
