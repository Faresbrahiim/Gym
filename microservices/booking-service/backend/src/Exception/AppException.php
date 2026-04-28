<?php

declare(strict_types=1);

namespace App\Exception;

abstract class AppException extends \RuntimeException
{
    public function __construct(string $message, private readonly int $httpStatusCode, ?\Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }

    public function getHttpStatusCode(): int
    {
        return $this->httpStatusCode;
    }
}
