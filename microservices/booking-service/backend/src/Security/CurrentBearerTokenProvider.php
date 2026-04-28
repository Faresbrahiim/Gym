<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class CurrentBearerTokenProvider
{
    public function __construct(
        private readonly RequestStack $requestStack,
    ) {}

    public function currentBearerToken(): string
    {
        $request = $this->requestStack->getCurrentRequest();
        $rawAuthorization = $request?->headers->get('Authorization', '');

        if (!is_string($rawAuthorization) || !str_starts_with($rawAuthorization, 'Bearer ')) {
            throw new HttpException(401, 'Authentication required.');
        }

        return substr($rawAuthorization, 7);
    }
}
