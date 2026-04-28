<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Exception\AppException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

#[AsEventListener(event: 'kernel.exception', priority: 10)]
final class ExceptionListener
{
    public function __construct(
        #[Autowire('%kernel.environment%')]
        private readonly string $env,
    ) {}

    public function __invoke(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        if ($exception instanceof AppException) {
            $response = new JsonResponse(
                ['error' => $exception->getMessage()],
                $exception->getHttpStatusCode(),
            );
        } elseif ($exception instanceof \DomainException) {
            $response = new JsonResponse(
                ['error' => $exception->getMessage()],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        } elseif ($exception instanceof HttpExceptionInterface) {
            $status   = $exception->getStatusCode();
            $response = new JsonResponse(
                ['error' => $exception->getMessage() ?: (Response::$statusTexts[$status] ?? 'An error occurred.')],
                $status,
                $exception->getHeaders(),
            );
        } else {
            $response = new JsonResponse([
                'error'     => 'An unexpected error occurred.',
                'exception' => $exception::class,
                'message'   => $exception->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $event->setResponse($response);
        $event->stopPropagation();
    }
}
