package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.PlanCapability;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.mapper.SubscriptionMapper;
import com.gym.membershipservice.application.port.AdminSubscriptionCommandService;
import com.gym.membershipservice.application.port.BookingCleanupService;
import com.gym.membershipservice.application.port.SubscriptionHistoryRecorder;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AdminSubscriptionCommandServiceImpl implements AdminSubscriptionCommandService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryRecorder historyService;
    private final BookingCleanupService bookingCleanupService;
    private final SubscriptionDomainSupport subscriptionDomainSupport;

    public AdminSubscriptionCommandServiceImpl(SubscriptionRepository subscriptionRepository,
                                               SubscriptionHistoryRecorder historyService,
                                               BookingCleanupService bookingCleanupService,
                                               SubscriptionDomainSupport subscriptionDomainSupport) {
        this.subscriptionRepository = subscriptionRepository;
        this.historyService = historyService;
        this.bookingCleanupService = bookingCleanupService;
        this.subscriptionDomainSupport = subscriptionDomainSupport;
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO cancelSubscription(UUID subscriptionId) {
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);

        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new BadRequestException("Already Cancelled");
        }
        if (sub.getPlan().getPrice() == null || sub.getPlan().getPrice() == 0) {
            throw new BadRequestException("Free plan cannot be cancelled");
        }

        LocalDateTime now = LocalDateTime.now();
        if (sub.getStartDate() != null && sub.getStartDate().plusDays(2).isBefore(now)) {
            throw new BadRequestException("Cannot cancel after 2 days have passed");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setEndDate(now);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.CANCELLED, null, "Cancelled");
        cancelFutureSessionBookingsIfNeeded(saved);

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO activateSubscription(UUID subscriptionId) {
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);
        if (sub.getStatus() == SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Already active");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.ACTIVE);

        if (sub.getEndDate() == null || sub.getEndDate().isBefore(LocalDateTime.now())) {
            Plan plan = sub.getPlan();
            subscriptionDomainSupport.validatePlanDuration(plan);
            LocalDateTime now = LocalDateTime.now();
            sub.setStartDate(now);
            sub.setEndDate(now.plusDays(plan.getDurationInDays()));
        }

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null, "Activated by admin");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO freezeSubscription(UUID subscriptionId, LocalDateTime freezeEnd) {
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE subscriptions can be frozen");
        }
        if (freezeEnd.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Freeze end must be in the future");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setPreviousStatusBeforeFreeze(previous);
        sub.setStatus(SubscriptionStatus.FROZEN);
        sub.setFreezeStartDate(LocalDateTime.now());
        sub.setFreezeEndDate(freezeEnd);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.FROZEN, null,
                "Subscription frozen until " + freezeEnd);

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO extendSubscription(UUID subscriptionId, int extraDays) {
        if (extraDays <= 0) {
            throw new BadRequestException("Extra days must be > 0");
        }

        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);
        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new BadRequestException("Cannot extend cancelled subscription");
        }

        SubscriptionStatus previous = sub.getStatus();
        LocalDateTime now = LocalDateTime.now();

        if (sub.getEndDate() != null && sub.getEndDate().isAfter(now)) {
            sub.setEndDate(sub.getEndDate().plusDays(extraDays));
        } else {
            sub.setStartDate(now);
            sub.setEndDate(now.plusDays(extraDays));
            sub.setStatus(SubscriptionStatus.ACTIVE);
        }

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, sub.getStatus(), null,
                "Extended by " + extraDays + " days");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO approvePause(UUID subscriptionId) {
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);
        if (sub.getStatus() != SubscriptionStatus.PAUSE_REQUESTED) {
            throw new BadRequestException("No pause request to approve");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.PAUSED);
        sub.setPausedAt(LocalDateTime.now());

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.PAUSED, null, "Pause approved");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO rejectPause(UUID subscriptionId) {
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);
        if (sub.getStatus() != SubscriptionStatus.PAUSE_REQUESTED) {
            throw new BadRequestException("No pause request to reject");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPausedAt(null);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null, "Pause rejected");

        return SubscriptionMapper.toDTO(saved);
    }

    private void cancelFutureSessionBookingsIfNeeded(Subscription subscription) {
        Plan plan = subscription.getPlan();
        if (plan.getCapabilities() != null && plan.getCapabilities().contains(PlanCapability.SESSION_BOOKING)) {
            bookingCleanupService.cancelFutureBookings(subscription.getUserId());
        }
    }
}
