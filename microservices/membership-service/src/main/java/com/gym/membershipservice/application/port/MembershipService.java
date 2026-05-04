package com.gym.membershipservice.application.port;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.BookingEligibilityResponseDTO;
import com.gym.membershipservice.application.dto.common.MembershipEntitlementsResponseDTO;
import com.gym.membershipservice.application.enums.SubscriptionStatus;

import java.util.List;
import java.util.UUID;

public interface MembershipService {

    SubscriptionStatus getUserStatus(UUID userId);

    SubscriptionResponseDTO getActiveSubscription(UUID userId);

    List<String> getPermissions(UUID userId);

    boolean validateMembership(UUID userId, String action);

    BookingEligibilityResponseDTO getBookingEligibility(UUID userId);

    MembershipEntitlementsResponseDTO getEntitlements(UUID userId);
}
