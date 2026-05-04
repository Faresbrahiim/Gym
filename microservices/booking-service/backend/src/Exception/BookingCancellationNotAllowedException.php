<?php

declare(strict_types=1);

namespace App\Exception;

use Symfony\Component\HttpFoundation\Response;

final class BookingCancellationNotAllowedException extends AppException
{
    public function __construct(string $message = 'This booking can no longer be cancelled.')
    {
        parent::__construct($message, Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
