<?php

declare(strict_types=1);

namespace App\Enum;

enum BookingStatus: string
{
    case PENDING   = 'PENDING';
    case ACCEPTED  = 'ACCEPTED';
    case DECLINED  = 'DECLINED';
    case CANCELLED = 'CANCELLED';
}
