<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\External\UserSummaryDto;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class UserSummaryService
{
    public function __construct(
        #[Autowire(service: 'user_service.client')]
        private readonly HttpClientInterface $client,
        private readonly SerializerInterface $serializer,
    ) {}

    public function getUserSummary(string $userId): UserSummaryDto
    {
        $response = $this->client->request('GET', "/internal/users/{$userId}/summary");

        return $this->serializer->deserialize(
            $response->getContent(),
            UserSummaryDto::class,
            'json',
        );
    }
}
