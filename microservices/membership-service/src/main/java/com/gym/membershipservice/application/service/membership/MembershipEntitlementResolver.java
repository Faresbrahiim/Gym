package com.gym.membershipservice.application.service.membership;

import com.gym.membershipservice.application.dto.common.BookingEligibilityResponseDTO;
import com.gym.membershipservice.application.dto.common.MembershipEntitlementsResponseDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.PlanCapability;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MembershipEntitlementResolver {

    public MembershipEntitlementsResponseDTO resolve(Subscription subscription) {
        if (subscription == null) {
            return new MembershipEntitlementsResponseDTO(
                    false,
                    "You need an active membership plan that includes coach sessions.",
                    false,
                    "You need an active membership plan that includes AI Coach.",
                    List.of()
            );
        }

        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            return new MembershipEntitlementsResponseDTO(
                    false,
                    "Coach session booking is available only with an active membership plan.",
                    false,
                    "AI Coach is available only with an active membership plan.",
                    List.of()
            );
        }

        Plan plan = subscription.getPlan();
        List<PlanCapability> capabilities = plan != null && plan.getCapabilities() != null
                ? plan.getCapabilities()
                : List.of();

        boolean sessionBookingAllowed = capabilities.contains(PlanCapability.SESSION_BOOKING);
        boolean aiCoachAllowed = capabilities.contains(PlanCapability.AI_COACH);

        return new MembershipEntitlementsResponseDTO(
                sessionBookingAllowed,
                sessionBookingAllowed ? null : "Your current membership plan does not include coach session booking.",
                aiCoachAllowed,
                aiCoachAllowed ? null : "Your current membership plan does not include AI Coach.",
                capabilities.stream().map(Enum::name).toList()
        );
    }

    public BookingEligibilityResponseDTO toBookingEligibility(MembershipEntitlementsResponseDTO entitlements) {
        return new BookingEligibilityResponseDTO(
                entitlements.sessionBookingAllowed(),
                entitlements.sessionBookingReason()
        );
    }
}
