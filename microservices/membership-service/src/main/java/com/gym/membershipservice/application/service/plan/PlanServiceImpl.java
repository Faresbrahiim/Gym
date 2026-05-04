package com.gym.membershipservice.application.service.plan;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Plan.PlanUpdateRequestDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import com.gym.membershipservice.application.dto.Plan.PlanResponseDTO;
import com.gym.membershipservice.application.mapper.PlanMapper;
import com.gym.membershipservice.application.dto.Plan.PlanRequestDTO;
import com.gym.membershipservice.application.port.PlanService;
import org.springframework.stereotype.Service;

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
        List<Plan> plans = repository.findAll();
        return PlanMapper.toDTOList(plans);
    }

    @Override
    public PlanResponseDTO getPlanById(UUID id) {
        Plan plan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
        return PlanMapper.toDTO(plan);
    }

    @Override
    public List<PlanResponseDTO> getActivePlans() {
        List<Plan> plans = repository.findByStatus(PlanStatus.ACTIVE);
        return PlanMapper.toDTOList(plans);
    }

    @Override
    public Plan getFreePlan() {
        return repository.findByStatusAndName(PlanStatus.ACTIVE, "Free")
                .orElseThrow(() -> new ResourceNotFoundException("Free plan not found"));
    }

    @Override
    public PlanResponseDTO createPlan(PlanRequestDTO dto) {

        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new BadRequestException("Plan name is required");
        }

        if (dto.getPrice() == null || dto.getPrice() < 0) {
            throw new BadRequestException("Price must be positive");
        }

        if (dto.getDurationInDays() == null) {
            dto.setDurationInDays(Integer.MAX_VALUE);
        } else if (dto.getDurationInDays() <= 0) {
            throw new BadRequestException("Duration must be greater than 0");
        }

        if (repository.existsByName(dto.getName())) {
            throw new ConflictException("Plan with this name already exists");
        }

        if ("Free".equalsIgnoreCase(dto.getName())) {
            dto.setPrice(0.0);
            dto.setDurationInDays(Integer.MAX_VALUE);
        }

        if (isPaid(dto.getPrice())) {
            ensureActivePaidPlanSlotAvailable();
        }

        Plan plan = PlanMapper.toEntity(dto);

        Plan saved = repository.save(plan);
        return PlanMapper.toDTO(saved);
    }
    @Override
    public PlanResponseDTO updatePlan(UUID id, PlanUpdateRequestDTO dto) {

        Plan plan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new BadRequestException("Plan name is required");
        }

        if (dto.getPrice() == null || dto.getPrice() < 0) {
            throw new BadRequestException("Price must be positive");
        }

        if (dto.getDurationInDays() == null) {
            dto.setDurationInDays(Integer.MAX_VALUE);
        } else if (dto.getDurationInDays() <= 0) {
            throw new BadRequestException("Duration must be greater than 0");
        }

        if (!plan.getName().equals(dto.getName()) && repository.existsByName(dto.getName())) {
            throw new BadRequestException("Plan with this name already exists");
        }

        if ("Free".equalsIgnoreCase(plan.getName()) && dto.getStatus() != null && dto.getStatus() != PlanStatus.ACTIVE) {
            throw new BadRequestException("Free plan cannot be deactivated");
        }

        PlanStatus targetStatus = dto.getStatus() != null ? dto.getStatus() : plan.getStatus();
        boolean targetIsActivePaid = targetStatus == PlanStatus.ACTIVE && isPaid(dto.getPrice());
        boolean currentIsActivePaid = plan.getStatus() == PlanStatus.ACTIVE && isPaid(plan.getPrice());

        if (targetIsActivePaid && !currentIsActivePaid) {
            ensureActivePaidPlanSlotAvailable();
        }

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
        if (plan.getStatus() != PlanStatus.ACTIVE && isPaid(plan.getPrice())) {
            ensureActivePaidPlanSlotAvailable();
        }
        plan.setStatus(PlanStatus.ACTIVE);
        return PlanMapper.toDTO(repository.save(plan));
    }

    private void ensureActivePaidPlanSlotAvailable() {
        long activePaidPlans = repository.countByStatusAndPriceGreaterThan(PlanStatus.ACTIVE, 0.0);
        if (activePaidPlans >= MAX_ACTIVE_PAID_PLANS) {
            throw new BadRequestException(
                    "You can only have 3 active paid plans at a time. Disable or delete one before adding or reactivating another."
            );
        }
    }

    private boolean isPaid(Double price) {
        return price != null && price > 0;
    }
}
