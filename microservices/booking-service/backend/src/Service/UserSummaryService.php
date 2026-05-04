<?php

declare(strict_types=1);

namespace App\Service;

use App\Contract\Service\UserSummaryServiceInterface;
use App\DTO\External\UserSummaryDto;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class UserSummaryService implements UserSummaryServiceInterface
{
    public function __construct(
        #[Autowire(service: 'user_service.client')]
        private readonly HttpClientInterface $client,
        private readonly SerializerInterface $serializer,
    ) {}

    public function getUserSummary(string $userId): UserSummaryDto
    {
        try {
            $response = $this->client->request('GET', "/internal/users/{$userId}/summary");

            return $this->serializer->deserialize(
                $response->getContent(),
                UserSummaryDto::class,
                'json',
            );
        } catch (ExceptionInterface $e) {
            throw new HttpException(Response::HTTP_SERVICE_UNAVAILABLE, 'User service is unavailable.', $e);
        }
    }
}
