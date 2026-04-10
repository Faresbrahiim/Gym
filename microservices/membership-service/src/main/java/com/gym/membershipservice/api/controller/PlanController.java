package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.service.plan.PlanServiceImpl;
import com.gym.membershipservice.application.dto.Plan.PlanResponseDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans")
@Tag(name = "Plans", description = "Public endpoints for gym plans")
public class PlanController {

    private final PlanServiceImpl service;

    public PlanController(PlanServiceImpl service) {
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
}