<?php

declare(strict_types=1);

namespace App\Contract\Service;

use App\DTO\External\BookingEligibilityDto;

interface MembershipEligibilityServiceInterface
{
    public function getBookingEligibility(): BookingEligibilityDto;
}
