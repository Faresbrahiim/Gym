package com.gym.membershipservice.application.port.out;


import com.gym.membershipservice.application.dto.PlanRequestDTO;
import com.gym.membershipservice.application.dto.PlanResponseDTO;
import com.gym.membershipservice.application.dto.PlanUpdateRequestDTO;
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
    public Plan getFreePlan() ;
}