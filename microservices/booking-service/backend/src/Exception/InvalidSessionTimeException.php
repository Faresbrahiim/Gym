<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class InvalidSessionTimeException extends AppException
{
    public function __construct()
    {
        parent::__construct('Session end time must be after the start time.', Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
