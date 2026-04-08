package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.service.plan.PlanServiceImpl;
import com.gym.membershipservice.application.dto.Plan.PlanResponseDTO;
import com.gym.membershipservice.application.dto.Plan.PlanRequestDTO;
import com.gym.membershipservice.application.dto.Plan.PlanUpdateRequestDTO;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans")
@Tag(name = "Plans", description = "Endpoints for managing gym plans")
public class PlanController {

    private final PlanServiceImpl service;

    public PlanController(PlanServiceImpl service) {
        this.service = service;
    }

    @Operation(summary = "Get all plans", description = "Retrieve all plans, both active and inactive")
    @GetMapping
    public List<PlanResponseDTO> getAllPlans() {
        return service.getAllPlans();
    }

    @Operation(summary = "Get plan by ID", description = "Retrieve a single plan by its UUID")
    @Parameter(name = "planId", description = "UUID of the plan", required = true)
    @GetMapping("/{planId}")
    public PlanResponseDTO getPlanById(@PathVariable UUID planId) {
        return service.getPlanById(planId);
    }

    @Operation(summary = "Get active plans", description = "Retrieve all plans that are currently active")
    @GetMapping("/active")
    public List<PlanResponseDTO> getActivePlans() {
        return service.getActivePlans();
    }

    @Operation(summary = "Create new plan", description = "Create a new plan (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Plan successfully created"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    @PostMapping("/admin")
    public PlanResponseDTO createPlan(@Valid @RequestBody PlanRequestDTO dto) {
        return service.createPlan(dto);
    }

    @Operation(summary = "Update a plan", description = "Update an existing plan by ID (admin only)")
    @Parameter(name = "planId", description = "UUID of the plan to update", required = true)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Plan successfully updated"),
            @ApiResponse(responseCode = "404", description = "Plan not found")
    })
    @PutMapping("/admin/{planId}")
    public PlanResponseDTO updatePlan(
            @PathVariable UUID planId,
            @Valid @RequestBody PlanUpdateRequestDTO dto) {
        return service.updatePlan(planId, dto);
    }

    @Operation(summary = "Delete a plan", description = "Delete an existing plan by ID (admin only)")
    @Parameter(name = "planId", description = "UUID of the plan to delete", required = true)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Plan successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Plan not found")
    })
    @DeleteMapping("/admin/{planId}")
    public void deletePlan(@PathVariable UUID planId) {
        service.deletePlan(planId);
    }

    @Operation(summary = "Enable a plan", description = "Enable an inactive plan by ID (admin only)")
    @Parameter(name = "planId", description = "UUID of the plan to enable", required = true)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Plan successfully enabled"),
            @ApiResponse(responseCode = "404", description = "Plan not found")
    })
    @PatchMapping("/admin/{planId}/enable")
    public PlanResponseDTO enablePlan(@PathVariable UUID planId) {
        return service.enablePlan(planId);
    }
}