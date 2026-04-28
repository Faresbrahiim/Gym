<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class SessionNotAvailableException extends AppException
{
    public function __construct()
    {
        parent::__construct(
            'This session is not available for booking.',
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
