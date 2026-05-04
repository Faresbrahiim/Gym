package com.gym.membershipservice.infrastructure.client;

import com.gym.membershipservice.application.port.BookingCleanupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Service
public class BookingCleanupHttpClient implements BookingCleanupService {

    private static final Logger log = LoggerFactory.getLogger(BookingCleanupHttpClient.class);

    private final RestClient restClient;

    public BookingCleanupHttpClient(
            @Value("${BOOKING_SERVICE_URL:http://booking-service}") String bookingServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(bookingServiceUrl)
                .build();
    }

    @Override
    public void cancelFutureBookings(UUID userId) {
        try {
            restClient.post()
                    .uri("/internal/users/{userId}/bookings/cancel-future", userId)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Failed to cancel future bookings for user {} after membership cancellation: {}",
                    userId, ex.getMessage());
        }
    }
}
