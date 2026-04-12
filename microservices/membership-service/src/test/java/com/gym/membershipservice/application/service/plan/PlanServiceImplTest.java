package com.gym.membershipservice.application.service.plan;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.application.dto.Plan.PlanRequestDTO;
import com.gym.membershipservice.application.dto.Plan.PlanUpdateRequestDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlanServiceImplTest {

    @Mock
    private PlanRepository repository;

    @InjectMocks
    private PlanServiceImpl planService;

    private UUID planId;

    @BeforeEach
    void setUp() {
        planId = UUID.randomUUID();
    }

    // =========================
    // CREATE PLAN TESTS
    // =========================

    @Test
    void shouldCreatePlanSuccessfully() {
        System.out.println("test4"); ;

        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(100.0);
        dto.setDurationInDays(30);

        when(repository.existsByName("Premium")).thenReturn(false);

        Plan savedPlan = new Plan();
        savedPlan.setId(planId);
        savedPlan.setName("Premium");

        when(repository.save(any(Plan.class))).thenReturn(savedPlan);

        var result = planService.createPlan(dto);

        assertNotNull(result);
        verify(repository, times(1)).save(any(Plan.class));
    }

    @Test
    void shouldThrowConflictIfPlanNameExists() {
        System.out.println("test4"); ;
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(100.0);
        dto.setDurationInDays(30);

        when(repository.existsByName("Premium")).thenReturn(true);

        assertThrows(ConflictException.class,
                () -> planService.createPlan(dto));
    }

    @Test
    void shouldThrowBadRequestIfPriceNegative() {
        System.out.println("test4"); ;

        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(-10.0);
        dto.setDurationInDays(30);

        assertThrows(BadRequestException.class,
                () -> planService.createPlan(dto));
    }

    // =========================
    // UPDATE PLAN TEST
    // =========================

    @Test
    void shouldUpdatePlanSuccessfully() {
        System.out.println("test4"); ;

        Plan existing = new Plan();
        existing.setId(planId);
        existing.setName("Basic");

        when(repository.findById(planId)).thenReturn(Optional.of(existing));

        PlanUpdateRequestDTO dto = new PlanUpdateRequestDTO();
        dto.setName("Premium");
        dto.setPrice(120.0);
        dto.setDurationInDays(30);
        dto.setStatus(PlanStatus.ACTIVE);

        when(repository.existsByName("Premium")).thenReturn(false);
        when(repository.save(any(Plan.class))).thenReturn(existing);

        var result = planService.updatePlan(planId, dto);

        assertNotNull(result);
        verify(repository).save(existing);
    }
}