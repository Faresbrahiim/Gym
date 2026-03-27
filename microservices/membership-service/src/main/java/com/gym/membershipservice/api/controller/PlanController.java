package com.gym.membershipservice.api.controller ;

import com.gym.membershipservice.application.service.PlanServiceImpl;
import com.gym.membershipservice.application.dto.PlanResponseDTO;
import org.springframework.web.bind.annotation.*;
import com.gym.membershipservice.application.dto.PlanRequestDTO;
import  com.gym.membershipservice.application.dto.PlanUpdateRequestDTO;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans")
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

    @PostMapping("/admin")
    public PlanResponseDTO createPlan(@Valid @RequestBody PlanRequestDTO dto) {
        return service.createPlan(dto);
    }

    @PutMapping("/admin/{planId}")
    public PlanResponseDTO updatePlan(
            @PathVariable UUID planId,
            @Valid @RequestBody PlanUpdateRequestDTO dto) {

        return service.updatePlan(planId, dto);
    }

    @DeleteMapping("/admin/{planId}")
    public void deletePlan(@PathVariable UUID planId) {
        service.deletePlan(planId);
    }

    @PatchMapping("/admin/{planId}/enable")
    public PlanResponseDTO enablePlan(@PathVariable UUID planId) {
        return service.enablePlan(planId);
    }


}
