package com.gym.membershipservice.application.dto.common;

public record BookingEligibilityResponseDTO(
        boolean allowed,
        String reason
) {}
