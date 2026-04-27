<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class SessionNotFoundException extends AppException
{
    public function __construct(string $sessionId)
    {
        parent::__construct(sprintf('Session "%s" not found.', $sessionId), Response::HTTP_NOT_FOUND);
    }
}
