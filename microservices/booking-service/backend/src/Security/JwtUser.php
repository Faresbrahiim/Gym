<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\Security\Core\User\UserInterface;

final class JwtUser implements UserInterface
{
    public function __construct(
        private readonly string $userId,
        private readonly array  $roles,
    ) {}

    public function getUserId(): string
    {
        return $this->userId;
    }

    /** @return list<string> */
    public function getRoles(): array
    {
        return $this->roles;
    }

    public function getUserIdentifier(): string
    {
        return $this->userId;
    }

    public function eraseCredentials(): void {}
}
