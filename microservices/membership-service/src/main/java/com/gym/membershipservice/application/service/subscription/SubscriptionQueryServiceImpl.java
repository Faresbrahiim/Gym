package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.application.dto.Subscription.AdminSubscriptionSummaryDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.UserMembership;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.mapper.SubscriptionMapper;
import com.gym.membershipservice.application.port.AdminSubscriptionQueryService;
import com.gym.membershipservice.application.port.UserSubscriptionQueryService;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import com.gym.membershipservice.infrastructure.repository.UserMembershipRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SubscriptionQueryServiceImpl implements UserSubscriptionQueryService, AdminSubscriptionQueryService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserMembershipRepository userMembershipRepository;
    private final SubscriptionDomainSupport subscriptionDomainSupport;

    public SubscriptionQueryServiceImpl(SubscriptionRepository subscriptionRepository,
                                        UserMembershipRepository userMembershipRepository,
                                        SubscriptionDomainSupport subscriptionDomainSupport) {
        this.subscriptionRepository = subscriptionRepository;
        this.userMembershipRepository = userMembershipRepository;
        this.subscriptionDomainSupport = subscriptionDomainSupport;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionResponseDTO> getUserSubscriptions(UUID userId) {
        return SubscriptionMapper.toDTOList(subscriptionRepository.findByUserId(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public SubscriptionResponseDTO getUserSubscriptionById(UUID userId, UUID subscriptionId) {
        return SubscriptionMapper.toDTO(subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subscriptionId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionResponseDTO> getAllSubscriptions() {
        List<Subscription> subs = subscriptionRepository.findAll();

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
    @Transactional(readOnly = true)
    public SubscriptionResponseDTO getSubscriptionById(UUID subscriptionId) {
        return SubscriptionMapper.toDTO(subscriptionDomainSupport.findAndAutoExpire(subscriptionId));
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
