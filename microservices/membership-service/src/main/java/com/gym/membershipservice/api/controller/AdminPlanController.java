package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.dto.Plan.PlanRequestDTO;
import com.gym.membershipservice.application.dto.Plan.PlanResponseDTO;
import com.gym.membershipservice.application.dto.Plan.PlanUpdateRequestDTO;
import com.gym.membershipservice.application.port.PlanService;

import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/plans/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Plans", description = "Admin-only plan management")
public class AdminPlanController {

    private final PlanService service;

    public AdminPlanController(PlanService service) {
        this.service = service;
    }

    @PostMapping
    public PlanResponseDTO createPlan(@Valid @RequestBody PlanRequestDTO dto) {
        return service.createPlan(dto);
    }

    @PutMapping("/{planId}")
    public PlanResponseDTO updatePlan(
            @PathVariable UUID planId,
            @Valid @RequestBody PlanUpdateRequestDTO dto) {
        return service.updatePlan(planId, dto);
    }

    @DeleteMapping("/{planId}")
    @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deletePlan(@PathVariable UUID planId) {
        service.deletePlan(planId);
    }

    @PatchMapping("/{planId}/enable")
    public PlanResponseDTO enablePlan(@PathVariable UUID planId) {
        return service.enablePlan(planId);
    }

    @PatchMapping("/{planId}/disable")
    public PlanResponseDTO disablePlan(@PathVariable UUID planId) {
        return service.disablePlan(planId);
    }
}
