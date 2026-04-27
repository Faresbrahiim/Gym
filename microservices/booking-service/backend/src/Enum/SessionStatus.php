<?php

declare(strict_types=1);

namespace App\Enum;

enum SessionStatus: string
{
    case OPEN      = 'OPEN';
    case CLOSED    = 'CLOSED';
    case CANCELLED = 'CANCELLED';
}
