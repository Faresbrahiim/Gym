<?php

declare(strict_types=1);

namespace App\Contract\Service;

use App\DTO\External\UserSummaryDto;

interface UserSummaryServiceInterface
{
    public function getUserSummary(string $userId): UserSummaryDto;
}
