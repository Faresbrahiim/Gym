package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.api.mapper.SubscriptionMapper;
import com.gym.membershipservice.application.dto.Subscription.AdminSubscriptionSummaryDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;
import com.gym.membershipservice.application.dto.kafka.SubscriptionCreatedEvent;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.UserMembership;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.PlanService;
import com.gym.membershipservice.application.port.SubscriptionHistoryService;
import com.gym.membershipservice.application.port.SubscriptionService;
import com.gym.membershipservice.application.service.plan.PlanServiceImpl;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import com.gym.membershipservice.infrastructure.repository.UserMembershipRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final SubscriptionHistoryService historyService;
    private final PlanService planService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final UserMembershipRepository userMembershipRepository;

    @org.springframework.beans.factory.annotation.Value("${payment.dev-mode:false}")
    private boolean paymentDevMode;

    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository,
                                   PlanRepository planRepository,
                                   SubscriptionHistoryService historyService,
                                   PlanServiceImpl planService,
                                   KafkaTemplate<String, Object> kafkaTemplate,
                                   UserMembershipRepository userMembershipRepository) {
        this.subscriptionRepository  = subscriptionRepository;
        this.planRepository          = planRepository;
        this.historyService          = historyService;
        this.planService             = planService;
        this.kafkaTemplate           = kafkaTemplate;
        this.userMembershipRepository = userMembershipRepository;
    }

    // =========================
    // BASIC METHODS
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionResponseDTO> getUserSubscriptions(UUID userId) {
        return SubscriptionMapper.toDTOList(subscriptionRepository.findByUserId(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public SubscriptionResponseDTO getUserSubscriptionById(UUID userId, UUID subscriptionId) {
        return SubscriptionMapper.toDTO(findOwnedAndAutoExpire(userId, subscriptionId));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponseDTO<SubscriptionHistoryResponseDTO> getUserSubscriptionHistory(UUID userId, int page, int pageSize) {
        return historyService.getHistoryForUser(userId, page, pageSize);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionResponseDTO> getAllSubscriptions() {
        List<Subscription> subs = subscriptionRepository.findAll();

        // Batch-fetch emails — one query regardless of how many subscriptions exist
        Set<UUID> userIds = subs.stream().map(Subscription::getUserId).collect(Collectors.toSet());
        Map<UUID, String> emailMap = userMembershipRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(UserMembership::getUserId, um -> um.getEmail() != null ? um.getEmail() : ""));

        return subs.stream()
                .map(s -> SubscriptionMapper.toDTO(s, emailMap.getOrDefault(s.getUserId(), null)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponseDTO<SubscriptionResponseDTO> getAllSubscriptions(int page, int pageSize, String statusFilter, String search) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.max(pageSize, 1);
        Pageable pageable = PageRequest.of(safePage - 1, safePageSize);

        Specification<Subscription> specification = buildAdminSubscriptionSpecification(statusFilter, search);
        Page<Subscription> subsPage = subscriptionRepository.findAll(specification, pageable);

        Set<UUID> userIds = subsPage.getContent().stream()
                .map(Subscription::getUserId)
                .collect(Collectors.toSet());

        Map<UUID, String> emailMap = userIds.isEmpty()
                ? Map.of()
                : userMembershipRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(UserMembership::getUserId, um -> um.getEmail() != null ? um.getEmail() : ""));

        List<SubscriptionResponseDTO> items = subsPage.getContent().stream()
                .map(s -> SubscriptionMapper.toDTO(s, emailMap.getOrDefault(s.getUserId(), null)))
                .toList();

        return PagedResponseDTO.of(items, safePage, safePageSize, subsPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminSubscriptionSummaryDTO getAdminSubscriptionSummary() {
        return new AdminSubscriptionSummaryDTO(
                subscriptionRepository.count(),
                subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE),
                subscriptionRepository.countByStatusIn(List.of(SubscriptionStatus.PAUSE_REQUESTED, SubscriptionStatus.CANCEL_REQUESTED)),
                subscriptionRepository.countByStatusIn(List.of(SubscriptionStatus.PAYMENT_FAILED, SubscriptionStatus.EXPIRED))
        );
    }

    @Override
    public SubscriptionResponseDTO getSubscriptionById(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        return SubscriptionMapper.toDTO(sub);
    }

    // internal helper — returns entity (used within this service only)
    private Subscription findAndAutoExpire(UUID subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));

        if (sub.getEndDate() != null &&
                sub.getEndDate().isBefore(LocalDateTime.now()) &&
                sub.getStatus() == SubscriptionStatus.ACTIVE) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
        }
        return sub;
    }

    private Subscription findOwnedAndAutoExpire(UUID userId, UUID subscriptionId) {
        Subscription sub = subscriptionRepository.findByIdAndUserId(subscriptionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));

        if (sub.getEndDate() != null &&
                sub.getEndDate().isBefore(LocalDateTime.now()) &&
                sub.getStatus() == SubscriptionStatus.ACTIVE) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
        }
        return sub;
    }

    // =========================
    // CREATE
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO createSubscription(UUID userId, UUID planId) {
        // If user has an ACTIVE subscription, block (they must use changePlan)
        if (subscriptionRepository.existsByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)) {
            throw new ConflictException("User already has an active subscription. Use plan change instead.");
        }

        // If user has a stale PENDING_PAYMENT subscription, cancel it so they can retry
        subscriptionRepository.findByUserIdAndStatus(userId, SubscriptionStatus.PENDING_PAYMENT)
                .ifPresent(staleSub -> {
                    staleSub.setStatus(SubscriptionStatus.CANCELLED);
                    staleSub.setEndDate(LocalDateTime.now());
                    subscriptionRepository.save(staleSub);
                    historyService.recordChange(staleSub, SubscriptionStatus.PENDING_PAYMENT,
                            SubscriptionStatus.CANCELLED, null, "Cancelled stale pending payment — retrying");
                });

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (plan.getStatus() == PlanStatus.INACTIVE) {
            throw new BadRequestException("Cannot subscribe to inactive plan");
        }

        validatePlanDuration(plan);

        LocalDateTime now = LocalDateTime.now();
        boolean isPaid = plan.getPrice() != null && plan.getPrice() > 0;

        Subscription sub = new Subscription();
        sub.setUserId(userId);
        sub.setPlan(plan);
        sub.setStartDate(now);

        boolean hasFixedDuration = plan.getDurationInDays() != null && plan.getDurationInDays() > 0;

        boolean activateImmediately = !isPaid || paymentDevMode;
        sub.setStatus(activateImmediately ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING_PAYMENT);
        sub.setEndDate(hasFixedDuration ? now.plusDays(plan.getDurationInDays()) : null);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, null, saved.getStatus(), null,
                activateImmediately ? "Created" : "Created — awaiting payment");

        kafkaTemplate.send("subscription.created", new SubscriptionCreatedEvent(
                saved.getId().toString(),
                userId.toString(),
                plan.getName()
        ));

        return SubscriptionMapper.toDTO(saved);
    }

    @Transactional
    public SubscriptionResponseDTO createFreeSubscription(UUID userId) {
        Plan freePlan = planService.getFreePlan();
        return createSubscription(userId, freePlan.getId());
    }

    // =========================
    // CANCEL
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO cancelSubscription(UUID userId, UUID subscriptionId) {
        findOwnedAndAutoExpire(userId, subscriptionId);
        return cancelSubscription(subscriptionId);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO cancelSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);

        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new BadRequestException("Already Cancelled");
        }
        if (sub.getPlan().getPrice() == null || sub.getPlan().getPrice() == 0) {
            throw new BadRequestException("Free plan cannot be cancelled");
        }

        LocalDateTime now = LocalDateTime.now();
        if (sub.getStartDate() != null && sub.getStartDate().plusDays(2).isBefore(now)) {
            throw new BadRequestException("Cannot cancel before 2 days");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setEndDate(now);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.CANCELLED, null, "Cancelled");

        return SubscriptionMapper.toDTO(saved);
    }

    // =========================
    // PAUSE / APPROVE / REJECT
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO pauseSubscription(UUID userId, UUID subscriptionId) {
        findOwnedAndAutoExpire(userId, subscriptionId);
        return pauseSubscription(subscriptionId);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO pauseSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE subscriptions can be paused");
        }
        if (sub.getPlan().getPrice() == null || sub.getPlan().getPrice() == 0) {
            throw new BadRequestException("Free plan cannot be paused");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.PAUSE_REQUESTED);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.PAUSE_REQUESTED,
                null, "Pause requested (waiting admin approval)");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO approvePause(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
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
        Subscription sub = findAndAutoExpire(subscriptionId);
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

    @Override
    @Transactional
    public SubscriptionResponseDTO resumeSubscription(UUID userId, UUID subscriptionId) {
        findOwnedAndAutoExpire(userId, subscriptionId);
        return resumeSubscription(subscriptionId);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO resumeSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() != SubscriptionStatus.PAUSED) {
            throw new BadRequestException("Only PAUSED subscriptions can be resumed");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPausedAt(null);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null, "Resumed");

        return SubscriptionMapper.toDTO(saved);
    }

    // =========================
    // RENEW / CHANGE PLAN
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO renewSubscription(UUID userId, UUID subscriptionId) {
        findOwnedAndAutoExpire(userId, subscriptionId);
        return renewSubscription(subscriptionId);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO renewSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new BadRequestException("Cannot renew cancelled subscription");
        }

        Plan plan = sub.getPlan();
        validatePlanDuration(plan);

        SubscriptionStatus previous = sub.getStatus();
        LocalDateTime now = LocalDateTime.now();

        boolean hasFixedDuration = plan.getDurationInDays() != null && plan.getDurationInDays() > 0;
        if (!hasFixedDuration) {
            sub.setStartDate(now);
            sub.setEndDate(null);
        } else if (sub.getEndDate() != null && sub.getEndDate().isAfter(now)) {
            sub.setEndDate(sub.getEndDate().plusDays(plan.getDurationInDays()));
        } else {
            sub.setStartDate(now);
            sub.setEndDate(now.plusDays(plan.getDurationInDays()));
        }

        sub.setStatus(SubscriptionStatus.ACTIVE);
        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null, "Renewed");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO changePlan(UUID userId, UUID subscriptionId, UUID newPlanId) {
        findOwnedAndAutoExpire(userId, subscriptionId);
        return changePlan(subscriptionId, newPlanId);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO changePlan(UUID subscriptionId, UUID newPlanId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        ensurePlanChangeAllowed(sub);

        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (newPlan.getStatus() == PlanStatus.INACTIVE) {
            throw new BadRequestException("Cannot switch to inactive plan");
        }

        validatePlanDuration(newPlan);

        SubscriptionStatus previous = sub.getStatus();
        String oldPlanName = sub.getPlan().getName();
        LocalDateTime now = LocalDateTime.now();

        boolean hasFixedDuration = newPlan.getDurationInDays() != null && newPlan.getDurationInDays() > 0;
        boolean isPaid = newPlan.getPrice() != null && newPlan.getPrice() > 0;

        sub.setPlan(newPlan);
        sub.setStartDate(now);
        sub.setEndDate(hasFixedDuration ? now.plusDays(newPlan.getDurationInDays()) : null);

        // If switching to a paid plan and dev mode is off, require payment
        boolean activateImmediately = !isPaid || paymentDevMode;
        sub.setStatus(activateImmediately ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING_PAYMENT);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, saved.getStatus(), null,
                "Plan changed from " + oldPlanName + " to " + newPlan.getName());

        return SubscriptionMapper.toDTO(saved);
    }

    // =========================
    // UPGRADE / DOWNGRADE
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO upgradeSubscription(UUID userId, UUID subscriptionId, UUID newPlanId) {
        findOwnedAndAutoExpire(userId, subscriptionId);
        return upgradeSubscription(subscriptionId, newPlanId);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO upgradeSubscription(UUID subscriptionId, UUID newPlanId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        ensurePlanChangeAllowed(sub);
        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (newPlan.getPrice().compareTo(sub.getPlan().getPrice()) <= 0) {
            throw new BadRequestException("New plan must be more expensive");
        }

        boolean upgradeHasFixed = newPlan.getDurationInDays() != null && newPlan.getDurationInDays() > 0;
        SubscriptionStatus previous = sub.getStatus();
        sub.setPlan(newPlan);
        sub.setStartDate(LocalDateTime.now());
        sub.setEndDate(upgradeHasFixed ? LocalDateTime.now().plusDays(newPlan.getDurationInDays()) : null);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, previous, null, "Upgraded to " + newPlan.getName());

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO downgradeSubscription(UUID userId, UUID subscriptionId, UUID newPlanId) {
        findOwnedAndAutoExpire(userId, subscriptionId);
        return downgradeSubscription(subscriptionId, newPlanId);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO downgradeSubscription(UUID subscriptionId, UUID newPlanId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        ensurePlanChangeAllowed(sub);
        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (newPlan.getPrice().compareTo(sub.getPlan().getPrice()) >= 0) {
            throw new BadRequestException("New plan must be cheaper");
        }

        boolean downgradeHasFixed = newPlan.getDurationInDays() != null && newPlan.getDurationInDays() > 0;
        SubscriptionStatus previous = sub.getStatus();
        sub.setPlan(newPlan);
        sub.setStartDate(LocalDateTime.now());
        sub.setEndDate(downgradeHasFixed ? LocalDateTime.now().plusDays(newPlan.getDurationInDays()) : null);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, previous, null, "Downgraded to " + newPlan.getName());

        return SubscriptionMapper.toDTO(saved);
    }

    // =========================
    // ADMIN / FREEZE
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO extendSubscription(UUID subscriptionId, int extraDays) {
        if (extraDays <= 0) throw new BadRequestException("Extra days must be > 0");

        Subscription sub = findAndAutoExpire(subscriptionId);
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
    public SubscriptionResponseDTO activateSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() == SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Already active");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.ACTIVE);

        if (sub.getEndDate() == null || sub.getEndDate().isBefore(LocalDateTime.now())) {
            Plan plan = sub.getPlan();
            validatePlanDuration(plan);
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
        Subscription sub = findAndAutoExpire(subscriptionId);

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

    // =========================
    // HISTORY
    // =========================

    @Override
    public List<SubscriptionHistoryResponseDTO> getSubscriptionHistory(UUID subscriptionId) {
        return historyService.getHistory(subscriptionId);
    }

    // =========================
    // HELPER
    // =========================

    private void validatePlanDuration(Plan plan) {
        if (plan.getDurationInDays() != null && plan.getDurationInDays() < 0) {
            throw new BadRequestException("Invalid plan duration");
        }
    }

    private void ensurePlanChangeAllowed(Subscription subscription) {
        SubscriptionStatus status = subscription.getStatus();
        if (status == SubscriptionStatus.ACTIVE) {
            return;
        }

        throw switch (status) {
            case PENDING_PAYMENT -> new BadRequestException("Plan changes are unavailable while payment is pending");
            case PAYMENT_FAILED -> new BadRequestException("Plan changes are unavailable until the payment issue is resolved");
            case PAUSED -> new BadRequestException("Resume your membership before changing plans");
            case FROZEN -> new BadRequestException("Plan changes are unavailable while the membership is frozen");
            default -> new BadRequestException("Only ACTIVE subscriptions can change plan");
        };
    }

    private Specification<Subscription> buildAdminSubscriptionSpecification(String statusFilter, String search) {
        Specification<Subscription> specification = (root, query, cb) -> cb.conjunction();

        List<SubscriptionStatus> statuses = resolveAdminStatuses(statusFilter);
        if (!statuses.isEmpty()) {
            specification = specification.and((root, query, cb) -> root.get("status").in(statuses));
        }

        String normalizedSearch = search != null ? search.trim().toLowerCase() : "";
        if (!normalizedSearch.isBlank()) {
            List<UUID> matchedUserIds = userMembershipRepository.findByEmailContainingIgnoreCase(normalizedSearch).stream()
                    .map(UserMembership::getUserId)
                    .toList();

            specification = specification.and((root, query, cb) -> {
                var planNameMatch = cb.like(cb.lower(root.get("plan").get("name")), "%" + normalizedSearch + "%");
                if (matchedUserIds.isEmpty()) {
                    return planNameMatch;
                }
                return cb.or(planNameMatch, root.get("userId").in(matchedUserIds));
            });
        }

        return specification;
    }

    private List<SubscriptionStatus> resolveAdminStatuses(String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) {
            return List.of();
        }

        return switch (statusFilter.toUpperCase()) {
            case "PENDING" -> List.of(SubscriptionStatus.PAUSE_REQUESTED, SubscriptionStatus.CANCEL_REQUESTED);
            case "ISSUES" -> List.of(SubscriptionStatus.PAYMENT_FAILED, SubscriptionStatus.EXPIRED);
            default -> {
                try {
                    yield List.of(SubscriptionStatus.valueOf(statusFilter.toUpperCase()));
                } catch (IllegalArgumentException ex) {
                    throw new BadRequestException("Unknown subscription status filter");
                }
            }
        };
    }
}
