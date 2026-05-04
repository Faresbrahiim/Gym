package com.gym.membershipservice.application.dto.common;

import java.util.List;

public record MembershipEntitlementsResponseDTO(
        boolean sessionBookingAllowed,
        String sessionBookingReason,
        boolean aiCoachAllowed,
        String aiCoachReason,
        List<String> capabilities
) {}
