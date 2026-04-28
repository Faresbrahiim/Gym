<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

final class JwtAuthenticator extends AbstractAuthenticator implements AuthenticationEntryPointInterface
{
    public function supports(Request $request): ?bool
    {
        return str_starts_with($request->headers->get('Authorization', ''), 'Bearer ');
    }

    public function authenticate(Request $request): Passport
    {
        $raw     = $request->headers->get('Authorization', '');
        $token   = substr($raw, 7);
        $payload = $this->decodePayload($token);

        $userId = $payload['sub'] ?? null;
        $role   = $payload['role'] ?? null;

        if (!is_string($userId) || $userId === '') {
            throw new CustomUserMessageAuthenticationException('JWT is missing the "sub" claim.');
        }

        if (!is_string($role) || $role === '') {
            throw new CustomUserMessageAuthenticationException('JWT is missing the "role" claim.');
        }

        $symfonyRole = $this->mapRole($role);

        return new SelfValidatingPassport(
            new UserBadge(
                $userId,
                static fn (string $id): JwtUser => new JwtUser($id, [$symfonyRole]),
            ),
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        return new JsonResponse(
            ['error' => $exception->getMessageKey()],
            Response::HTTP_UNAUTHORIZED,
        );
    }

    public function start(Request $request, ?AuthenticationException $authException = null): Response
    {
        return new JsonResponse(
            ['error' => 'Authentication required.'],
            Response::HTTP_UNAUTHORIZED,
        );
    }

    private function decodePayload(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new CustomUserMessageAuthenticationException('Malformed JWT: expected 3 dot-separated segments.');
        }

        $json = base64_decode(strtr($parts[1], '-_', '+/'), true);

        if ($json === false) {
            throw new CustomUserMessageAuthenticationException('JWT payload contains invalid base64.');
        }

        $payload = json_decode($json, true);

        if (!is_array($payload)) {
            throw new CustomUserMessageAuthenticationException('JWT payload is not valid JSON.');
        }

        return $payload;
    }

    private function mapRole(string $role): string
    {
        return match (strtoupper($role)) {
            'COACH'  => 'ROLE_COACH',
            'MEMBER' => 'ROLE_MEMBER',
            'ADMIN'  => 'ROLE_ADMIN',
            default  => throw new CustomUserMessageAuthenticationException(
                sprintf('Unknown role "%s" in JWT.', $role),
            ),
        };
    }
}
