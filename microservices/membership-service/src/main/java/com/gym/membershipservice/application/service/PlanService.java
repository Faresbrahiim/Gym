package com.gym.membershipservice.application.service;

import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import com.gym.membershipservice.application.dto.PlanResponseDTO;
import com.gym.membershipservice.api.mapper.PlanMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PlanService {

    private final PlanRepository repository;

    public PlanService(PlanRepository repository) {
        this.repository = repository;
    }

    public List<PlanResponseDTO> getAllPlans() {
        List<Plan> plans = repository.findAll();
        return PlanMapper.toDTOList(plans);
    }

    public PlanResponseDTO getPlanById(UUID id) {
        Plan plan = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        return PlanMapper.toDTO(plan);
    }

    public List<PlanResponseDTO> getActivePlans() {
        List<Plan> plans = repository.findByStatus(PlanStatus.ACTIVE);
        return PlanMapper.toDTOList(plans);
    }
}