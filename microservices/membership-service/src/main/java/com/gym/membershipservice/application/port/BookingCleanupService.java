package com.gym.membershipservice.application.port;

import java.util.UUID;

public interface BookingCleanupService {
    void cancelFutureBookings(UUID userId);
}
