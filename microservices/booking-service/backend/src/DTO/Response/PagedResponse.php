<?php

declare(strict_types=1);

namespace App\DTO\Response;

/**
 * @template T of object
 */
final readonly class PagedResponse
{
    /**
     * @param T[]  $items
     */
    public function __construct(
        public array $items,
        public int   $total,
        public int   $page,
        public int   $pageSize,
        public int   $totalPages,
    ) {}
}
