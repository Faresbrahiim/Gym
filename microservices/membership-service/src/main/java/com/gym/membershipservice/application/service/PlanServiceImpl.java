package com.gym.membershipservice.application.service;

import com.gym.membershipservice.application.dto.PlanUpdateRequestDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import com.gym.membershipservice.application.dto.PlanResponseDTO;
import com.gym.membershipservice.api.mapper.PlanMapper;
import org.springframework.stereotype.Service;
import com.gym.membershipservice.application.dto.PlanRequestDTO;
import  com.gym.membershipservice.application.port.out.PlanService;
import  com.gym.membershipservice.application.dto.PlanUpdateRequestDTO;
import java.util.List;
import java.util.UUID;

@Service
public class PlanServiceImpl implements PlanService {

    private final PlanRepository repository;

    public PlanServiceImpl(PlanRepository repository) {
        this.repository = repository;
    }

    // TODO : filter  by client or admin using JWT ...
    @Override
    public List<PlanResponseDTO> getAllPlans() {
        List<Plan> plans = repository.findAll();
        return PlanMapper.toDTOList(plans);
    }

    @Override
    public PlanResponseDTO getPlanById(UUID id) {
        Plan plan = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        return PlanMapper.toDTO(plan);
    }

    @Override
    public List<PlanResponseDTO> getActivePlans() {
        List<Plan> plans = repository.findByStatus(PlanStatus.ACTIVE);
        return PlanMapper.toDTOList(plans);
    }

    @Override
    public PlanResponseDTO createPlan(PlanRequestDTO dto) {
        Plan plan = PlanMapper.toEntity(dto);
        Plan saved = repository.save(plan);
        return PlanMapper.toDTO(saved);
    }

    @Override
    public PlanResponseDTO updatePlan(UUID id, PlanUpdateRequestDTO dto) {

        Plan plan = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        // update only allowed fields
        plan.setName(dto.getName());
        plan.setDescription(dto.getDescription());
        plan.setPrice(dto.getPrice());
        plan.setDurationInDays(dto.getDurationInDays());
        plan.setStatus(dto.getStatus());

        Plan updatedPlan = repository.save(plan);

        return PlanMapper.toDTO(updatedPlan);
    }
    @Override
    public void deletePlan(UUID id) {

        Plan plan = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        plan.setStatus(PlanStatus.INACTIVE);

        repository.save(plan);
    }

    @Override
    public PlanResponseDTO enablePlan(UUID id) {
        Plan plan = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        plan.setStatus(PlanStatus.ACTIVE);
        return PlanMapper.toDTO(repository.save(plan));
    }
}