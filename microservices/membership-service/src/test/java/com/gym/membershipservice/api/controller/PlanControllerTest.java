package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Plan.PlanResponseDTO;
import com.gym.membershipservice.application.service.plan.PlanServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlanControllerTest {

    @Mock
    private PlanServiceImpl service;

    @InjectMocks
    private PlanController controller;

    private UUID planId;
    private PlanResponseDTO activeDTO;
    private PlanResponseDTO inactiveDTO;

    @BeforeEach
    void setUp() {
        planId = UUID.randomUUID();

        activeDTO = new PlanResponseDTO(
                planId, "Gold", "Gold plan", 99.99, 30, "ACTIVE", new java.util.ArrayList<>()
        );
        inactiveDTO = new PlanResponseDTO(
                UUID.randomUUID(), "Basic", "Basic plan", 0.0, Integer.MAX_VALUE, "INACTIVE", new java.util.ArrayList<>()
        );
    }

    // ──────────────────────────────────────────────
    // getAllPlans
    // ──────────────────────────────────────────────

    @Test
    void getAllPlans_returnsAllPlans() {
        when(service.getAllPlans()).thenReturn(List.of(activeDTO, inactiveDTO));

        List<PlanResponseDTO> result = controller.getAllPlans();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(PlanResponseDTO::getName)
                .containsExactly("Gold", "Basic");
        verify(service).getAllPlans();
    }

    @Test
    void getAllPlans_returnsEmptyList_whenNoPlansExist() {
        when(service.getAllPlans()).thenReturn(List.of());

        List<PlanResponseDTO> result = controller.getAllPlans();

        assertThat(result).isEmpty();
        verify(service).getAllPlans();
    }

    // ──────────────────────────────────────────────
    // getPlanById
    // ──────────────────────────────────────────────

    @Test
    void getPlanById_returnsCorrectPlan() {
        when(service.getPlanById(planId)).thenReturn(activeDTO);

        PlanResponseDTO result = controller.getPlanById(planId);

        assertThat(result.getId()).isEqualTo(planId);
        assertThat(result.getName()).isEqualTo("Gold");
        assertThat(result.getPrice()).isEqualTo(99.99);
        verify(service).getPlanById(planId);
    }

    @Test
    void getPlanById_throwsResourceNotFoundException_whenPlanNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(service.getPlanById(unknownId))
                .thenThrow(new ResourceNotFoundException("Plan not found"));

        assertThatThrownBy(() -> controller.getPlanById(unknownId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Plan not found");

        verify(service).getPlanById(unknownId);
    }

    // ──────────────────────────────────────────────
    // getActivePlans
    // ──────────────────────────────────────────────

    @Test
    void getActivePlans_returnsOnlyActivePlans() {
        when(service.getActivePlans()).thenReturn(List.of(activeDTO));

        List<PlanResponseDTO> result = controller.getActivePlans();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("ACTIVE");
        verify(service).getActivePlans();
    }

    @Test
    void getActivePlans_returnsEmptyList_whenNoActivePlans() {
        when(service.getActivePlans()).thenReturn(List.of());

        List<PlanResponseDTO> result = controller.getActivePlans();

        assertThat(result).isEmpty();
        verify(service).getActivePlans();
    }
}