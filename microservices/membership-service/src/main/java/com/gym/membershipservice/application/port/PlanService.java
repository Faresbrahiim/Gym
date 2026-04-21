package com.gym.membershipservice.application.port;


import com.gym.membershipservice.application.dto.Plan.PlanRequestDTO;
import com.gym.membershipservice.application.dto.Plan.PlanResponseDTO;
import com.gym.membershipservice.application.dto.Plan.PlanUpdateRequestDTO;
import com.gym.membershipservice.application.entity.Plan;

import java.util.List;
import java.util.UUID;



public interface PlanService {

    List<PlanResponseDTO> getAllPlans();

    PlanResponseDTO getPlanById(UUID id);

    List<PlanResponseDTO> getActivePlans();

    PlanResponseDTO createPlan(PlanRequestDTO dto);

    PlanResponseDTO updatePlan(UUID id, PlanUpdateRequestDTO dto);

    void deletePlan(UUID id);

    PlanResponseDTO enablePlan(UUID id);
    PlanResponseDTO disablePlan(UUID id);
    public Plan getFreePlan() ;
}