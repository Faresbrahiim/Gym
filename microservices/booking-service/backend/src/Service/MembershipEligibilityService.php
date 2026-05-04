<?php

declare(strict_types=1);

namespace App\Service;

use App\Contract\Service\MembershipEligibilityServiceInterface;
use App\DTO\External\BookingEligibilityDto;
use App\Security\CurrentBearerTokenProvider;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class MembershipEligibilityService implements MembershipEligibilityServiceInterface
{
    public function __construct(
        #[Autowire(service: 'membership_service.client')]
        private readonly HttpClientInterface $client,
        private readonly CurrentBearerTokenProvider $bearerTokenProvider,
    ) {}

    public function getBookingEligibility(): BookingEligibilityDto
    {
        try {
            $response = $this->client->request('GET', '/api/subscriptions/me/booking-eligibility', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->bearerTokenProvider->currentBearerToken(),
                ],
            ]);

            /** @var array{allowed?: bool, reason?: ?string} $data */
            $data = $response->toArray();

            return new BookingEligibilityDto(
                allowed: (bool) ($data['allowed'] ?? false),
                reason: isset($data['reason']) && is_string($data['reason']) ? $data['reason'] : null,
            );
        } catch (HttpException $e) {
            throw $e;
        } catch (ExceptionInterface $e) {
            throw new HttpException(Response::HTTP_SERVICE_UNAVAILABLE, 'Membership service is unavailable.', $e);
        }
    }
}
