package com.gym.membershipservice.api.controller ;

import com.gym.membershipservice.application.service.PlanService;
import com.gym.membershipservice.application.dto.PlanResponseDTO;
import org.springframework.web.bind.annotation.*;
import com.gym.membershipservice.application.dto.PlanRequestDTO;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlanService service;

    public PlanController(PlanService service) {
        this.service = service;
    }

    @GetMapping
    public List<PlanResponseDTO> getAllPlans() {
        return service.getAllPlans();
    }

    @GetMapping("/{planId}")
    public PlanResponseDTO getPlanById(@PathVariable UUID planId) {
        return service.getPlanById(planId);
    }

    @GetMapping("/active")
    public List<PlanResponseDTO> getActivePlans() {
        return service.getActivePlans();
    }

    @PostMapping("/admin")
    public PlanResponseDTO createPlan(@Valid @RequestBody PlanRequestDTO dto) {
        return service.createPlan(dto);
    }
}