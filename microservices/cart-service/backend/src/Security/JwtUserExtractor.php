<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Uid\Uuid;

class JwtUserExtractor
{
    public function extractUserId(Request $request): Uuid
    {
        $payload = $this->payload($request);

        if (empty($payload['sub'])) {
            throw new \RuntimeException('JWT missing sub claim', 401);
        }

        return Uuid::fromString($payload['sub']);
    }

    public function extractRole(Request $request): string
    {
        return $this->payload($request)['role'] ?? '';
    }

    private function payload(Request $request): array
    {
        $header = $request->headers->get('Authorization', '');

        if (!str_starts_with($header, 'Bearer ')) {
            throw new \RuntimeException('Missing Bearer token', 401);
        }

        $parts = explode('.', substr($header, 7));

        if (count($parts) !== 3) {
            throw new \RuntimeException('Malformed JWT', 401);
        }

        $base64 = strtr($parts[1], '-_', '+/');
        $json   = base64_decode(str_pad($base64, strlen($base64) + (4 - strlen($base64) % 4) % 4, '='));
        $data   = json_decode($json, true);

        if (!is_array($data)) {
            throw new \RuntimeException('Invalid JWT payload', 401);
        }

        return $data;
    }
}
