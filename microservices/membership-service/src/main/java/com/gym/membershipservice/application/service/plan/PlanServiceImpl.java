package com.gym.membershipservice.application.service.plan;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Plan.PlanRequestDTO;
import com.gym.membershipservice.application.dto.Plan.PlanResponseDTO;
import com.gym.membershipservice.application.dto.Plan.PlanUpdateRequestDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.enums.PlanCapability;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.application.mapper.PlanMapper;
import com.gym.membershipservice.application.port.PlanService;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
public class PlanServiceImpl implements PlanService {
    private static final int MAX_ACTIVE_PAID_PLANS = 3;

    private final PlanRepository repository;

    public PlanServiceImpl(PlanRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<PlanResponseDTO> getAllPlans() {
        return PlanMapper.toDTOList(repository.findAll());
    }

    @Override
    public PlanResponseDTO getPlanById(UUID id) {
        Plan plan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
        return PlanMapper.toDTO(plan);
    }

    @Override
    public List<PlanResponseDTO> getActivePlans() {
        return PlanMapper.toDTOList(repository.findByStatus(PlanStatus.ACTIVE));
    }

    @Override
    public Plan getFreePlan() {
        return repository.findByStatusAndName(PlanStatus.ACTIVE, "Free")
                .orElseThrow(() -> new ResourceNotFoundException("Free plan not found"));
    }

    @Override
    public PlanResponseDTO createPlan(PlanRequestDTO dto) {
        validateBasePlanInput(dto.getName(), dto.getPrice(), dto.getDurationInDays());

        if (repository.existsByName(dto.getName())) {
            throw new ConflictException("Plan with this name already exists");
        }

        if ("Free".equalsIgnoreCase(dto.getName())) {
            dto.setPrice(0.0);
            dto.setDurationInDays(Integer.MAX_VALUE);
        } else if (dto.getDurationInDays() == null) {
            dto.setDurationInDays(Integer.MAX_VALUE);
        }

        List<PlanCapability> capabilities = normalizeCapabilities(dto.getCapabilities(), dto.getPrice());
        validateActivePaidPlanConfiguration(null, dto.getPrice(), PlanStatus.ACTIVE, capabilities);

        Plan plan = PlanMapper.toEntity(dto);
        plan.setCapabilities(new ArrayList<>(capabilities));

        return PlanMapper.toDTO(repository.save(plan));
    }

    @Override
    public PlanResponseDTO updatePlan(UUID id, PlanUpdateRequestDTO dto) {
        Plan plan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        validateBasePlanInput(dto.getName(), dto.getPrice(), dto.getDurationInDays());

        if (!plan.getName().equals(dto.getName()) && repository.existsByName(dto.getName())) {
            throw new BadRequestException("Plan with this name already exists");
        }

        if ("Free".equalsIgnoreCase(plan.getName()) && dto.getStatus() != null && dto.getStatus() != PlanStatus.ACTIVE) {
            throw new BadRequestException("Free plan cannot be deactivated");
        }

        if ("Free".equalsIgnoreCase(plan.getName())) {
            dto.setPrice(0.0);
            dto.setDurationInDays(Integer.MAX_VALUE);
        } else if (dto.getDurationInDays() == null) {
            dto.setDurationInDays(Integer.MAX_VALUE);
        }

        PlanStatus targetStatus = dto.getStatus() != null ? dto.getStatus() : plan.getStatus();
        List<PlanCapability> capabilities = normalizeCapabilities(dto.getCapabilities(), dto.getPrice());
        validateActivePaidPlanConfiguration(plan.getId(), dto.getPrice(), targetStatus, capabilities);

        plan.setName(dto.getName());
        plan.setDescription(dto.getDescription());
        plan.setPrice(dto.getPrice());
        plan.setDurationInDays(dto.getDurationInDays());
        if (dto.getStatus() != null) {
            plan.setStatus(dto.getStatus());
        }
        if (dto.getFeatures() != null) {
            plan.getFeatures().clear();
            plan.getFeatures().addAll(dto.getFeatures());
        }
        plan.getCapabilities().clear();
        plan.getCapabilities().addAll(capabilities);

        return PlanMapper.toDTO(repository.save(plan));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deletePlan(UUID id) {
        Plan plan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
        if ("Free".equalsIgnoreCase(plan.getName())) {
            throw new BadRequestException("Free plan cannot be deleted");
        }
        if (plan.getSubscriptions() != null && !plan.getSubscriptions().isEmpty()) {
            throw new ConflictException("Cannot delete plan because it is actively used in subscriptions");
        }

        repository.delete(plan);
    }

    @Override
    public PlanResponseDTO disablePlan(UUID id) {
        Plan plan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
        if ("Free".equalsIgnoreCase(plan.getName())) {
            throw new BadRequestException("Free plan cannot be deactivated");
        }
        plan.setStatus(PlanStatus.INACTIVE);
        return PlanMapper.toDTO(repository.save(plan));
    }

    @Override
    public PlanResponseDTO enablePlan(UUID id) {
        Plan plan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
        validateActivePaidPlanConfiguration(plan.getId(), plan.getPrice(), PlanStatus.ACTIVE, plan.getCapabilities());
        plan.setStatus(PlanStatus.ACTIVE);
        return PlanMapper.toDTO(repository.save(plan));
    }

    private void validateBasePlanInput(String name, Double price, Integer durationInDays) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Plan name is required");
        }

        if (price == null || price < 0) {
            throw new BadRequestException("Price must be positive");
        }

        if (durationInDays != null && durationInDays <= 0) {
            throw new BadRequestException("Duration must be greater than 0");
        }
    }

    private void validateActivePaidPlanConfiguration(
            UUID currentPlanId,
            Double price,
            PlanStatus status,
            List<PlanCapability> capabilities
    ) {
        if (status != PlanStatus.ACTIVE || !isPaid(price)) {
            return;
        }

        List<Plan> activePaidPlans = repository.findByStatus(PlanStatus.ACTIVE).stream()
                .filter(plan -> isPaid(plan.getPrice()))
                .filter(plan -> currentPlanId == null || !plan.getId().equals(currentPlanId))
                .toList();

        if (activePaidPlans.size() >= MAX_ACTIVE_PAID_PLANS) {
            throw new BadRequestException(
                    "You can only have 3 active paid plans at a time. Disable or delete one before adding or reactivating another."
            );
        }

        PaidPlanTier targetTier = determineTier(capabilities);
        ensureContiguousTierProgression(activePaidPlans, targetTier);

        boolean duplicateTier = activePaidPlans.stream()
                .map(plan -> determineTier(plan.getCapabilities()))
                .anyMatch(tier -> tier == targetTier);
        if (duplicateTier) {
            throw new BadRequestException(
                    "Only one active paid plan can occupy each premium tier. Disable or update the existing one first."
            );
        }

        for (Plan existing : activePaidPlans) {
            PaidPlanTier existingTier = determineTier(existing.getCapabilities());
            if (targetTier.rank < existingTier.rank && price >= existing.getPrice()) {
                throw new BadRequestException("Lower-tier paid plans must stay cheaper than higher-tier paid plans.");
            }
            if (targetTier.rank > existingTier.rank && price <= existing.getPrice()) {
                throw new BadRequestException("Higher-tier paid plans must stay more expensive than lower-tier paid plans.");
            }
        }
    }

    private void ensureContiguousTierProgression(List<Plan> activePaidPlans, PaidPlanTier targetTier) {
        boolean hasBasic = activePaidPlans.stream()
                .map(plan -> determineTier(plan.getCapabilities()))
                .anyMatch(tier -> tier == PaidPlanTier.BASIC);
        boolean hasSession = activePaidPlans.stream()
                .map(plan -> determineTier(plan.getCapabilities()))
                .anyMatch(tier -> tier == PaidPlanTier.SESSION);

        if (targetTier == PaidPlanTier.SESSION && !hasBasic) {
            throw new BadRequestException(
                    "A session-enabled paid plan can only be activated after you have an active basic paid plan."
            );
        }

        if (targetTier == PaidPlanTier.PREMIUM && (!hasBasic || !hasSession)) {
            throw new BadRequestException(
                    "An AI Coach paid plan requires active lower tiers first: one basic paid plan and one session-enabled paid plan."
            );
        }
    }

    private List<PlanCapability> normalizeCapabilities(List<String> rawCapabilities, Double price) {
        LinkedHashSet<PlanCapability> normalized = new LinkedHashSet<>();

        if (rawCapabilities != null) {
            for (String value : rawCapabilities) {
                if (value == null || value.isBlank()) {
                    continue;
                }
                try {
                    normalized.add(PlanCapability.valueOf(value.trim().toUpperCase()));
                } catch (IllegalArgumentException ex) {
                    throw new BadRequestException("Unknown plan capability: " + value);
                }
            }
        }

        if (!isPaid(price) && !normalized.isEmpty()) {
            throw new BadRequestException("Free plans cannot grant premium capabilities.");
        }

        if (normalized.contains(PlanCapability.AI_COACH) && !normalized.contains(PlanCapability.SESSION_BOOKING)) {
            throw new BadRequestException("AI Coach can only be enabled on plans that include coach sessions.");
        }

        return List.copyOf(normalized);
    }

    private PaidPlanTier determineTier(List<PlanCapability> capabilities) {
        boolean sessionBooking = capabilities != null && capabilities.contains(PlanCapability.SESSION_BOOKING);
        boolean aiCoach = capabilities != null && capabilities.contains(PlanCapability.AI_COACH);

        if (!sessionBooking && !aiCoach) {
            return PaidPlanTier.BASIC;
        }
        if (sessionBooking && !aiCoach) {
            return PaidPlanTier.SESSION;
        }
        if (sessionBooking) {
            return PaidPlanTier.PREMIUM;
        }

        throw new BadRequestException("Invalid capability combination for a paid plan.");
    }

    private boolean isPaid(Double price) {
        return price != null && price > 0;
    }

    private enum PaidPlanTier {
        BASIC(0),
        SESSION(1),
        PREMIUM(2);

        private final int rank;

        PaidPlanTier(int rank) {
            this.rank = rank;
        }
    }
}
