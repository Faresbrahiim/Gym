<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class SessionFullException extends AppException
{
    public function __construct()
    {
        parent::__construct(
            'This session has reached its maximum number of participants.',
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
