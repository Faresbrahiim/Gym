<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class SessionNotFoundException extends AppException
{
    public function __construct()
    {
        parent::__construct('Session not found.', Response::HTTP_NOT_FOUND);
    }
}
