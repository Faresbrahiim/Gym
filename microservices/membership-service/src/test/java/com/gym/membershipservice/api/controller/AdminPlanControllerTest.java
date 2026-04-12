package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Plan.PlanRequestDTO;
import com.gym.membershipservice.application.dto.Plan.PlanResponseDTO;
import com.gym.membershipservice.application.dto.Plan.PlanUpdateRequestDTO;
import com.gym.membershipservice.application.service.plan.PlanServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminPlanControllerTest {

    @Mock
    private PlanServiceImpl service;

    @InjectMocks
    private AdminPlanController controller;

    private UUID planId;
    private PlanResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        planId = UUID.randomUUID();
        responseDTO = new PlanResponseDTO(planId, "Gold", "Gold plan", 99.99, 30, "ACTIVE");
    }

    // ── createPlan ──────────────────────────────────

    @Test
    void createPlan_returnsCreatedPlan() {
        PlanRequestDTO request = new PlanRequestDTO();
        request.setName("Gold");
        request.setPrice(99.99);
        request.setDurationInDays(30);

        when(service.createPlan(request)).thenReturn(responseDTO);

        PlanResponseDTO result = controller.createPlan(request);

        assertThat(result.getName()).isEqualTo("Gold");
        assertThat(result.getPrice()).isEqualTo(99.99);
        verify(service).createPlan(request);
    }

    // ── updatePlan ──────────────────────────────────

    @Test
    void updatePlan_returnsUpdatedPlan() {
        PlanUpdateRequestDTO updateRequest = new PlanUpdateRequestDTO();
        updateRequest.setName("Gold Updated");
        updateRequest.setPrice(120.0);
        updateRequest.setDurationInDays(60);

        PlanResponseDTO updated = new PlanResponseDTO(planId, "Gold Updated", "desc", 120.0, 60, "ACTIVE");
        when(service.updatePlan(planId, updateRequest)).thenReturn(updated);

        PlanResponseDTO result = controller.updatePlan(planId, updateRequest);

        assertThat(result.getName()).isEqualTo("Gold Updated");
        assertThat(result.getDurationInDays()).isEqualTo(60);
        verify(service).updatePlan(planId, updateRequest);
    }

    @Test
    void updatePlan_throwsException_whenPlanNotFound() {
        PlanUpdateRequestDTO updateRequest = new PlanUpdateRequestDTO();
        UUID unknownId = UUID.randomUUID();

        when(service.updatePlan(unknownId, updateRequest))
                .thenThrow(new ResourceNotFoundException("Plan not found"));

        assertThatThrownBy(() -> controller.updatePlan(unknownId, updateRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Plan not found");
    }

    // ── deletePlan ──────────────────────────────────

    @Test
    void deletePlan_callsServiceDelete() {
        doNothing().when(service).deletePlan(planId);

        controller.deletePlan(planId);

        verify(service).deletePlan(planId);
    }

    @Test
    void deletePlan_throwsException_whenPlanNotFound() {
        UUID unknownId = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Plan not found"))
                .when(service).deletePlan(unknownId);

        assertThatThrownBy(() -> controller.deletePlan(unknownId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Plan not found");
    }

    // ── enablePlan ──────────────────────────────────

    @Test
    void enablePlan_returnsEnabledPlan() {
        PlanResponseDTO enabled = new PlanResponseDTO(planId, "Gold", "desc", 99.99, 30, "ACTIVE");
        when(service.enablePlan(planId)).thenReturn(enabled);

        PlanResponseDTO result = controller.enablePlan(planId);

        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        verify(service).enablePlan(planId);
    }

    @Test
    void enablePlan_throwsException_whenPlanNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(service.enablePlan(unknownId))
                .thenThrow(new ResourceNotFoundException("Plan not found"));

        assertThatThrownBy(() -> controller.enablePlan(unknownId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}