<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class UnauthorizedCoachException extends AppException
{
    public function __construct()
    {
        parent::__construct('You are not the owner of this session.', Response::HTTP_FORBIDDEN);
    }
}
