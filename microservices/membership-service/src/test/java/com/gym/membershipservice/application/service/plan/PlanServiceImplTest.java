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
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(100.0);
        dto.setDurationInDays(30);

        when(repository.existsByName("Premium")).thenReturn(false);
        when(repository.countByStatusAndPriceGreaterThan(PlanStatus.ACTIVE, 0.0)).thenReturn(2L);

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
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(-10.0);
        dto.setDurationInDays(30);

        assertThrows(BadRequestException.class,
                () -> planService.createPlan(dto));
    }

    @Test
    void shouldRejectCreatingFourthActivePaidPlan() {
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(100.0);
        dto.setDurationInDays(30);

        when(repository.existsByName("Premium")).thenReturn(false);
        when(repository.countByStatusAndPriceGreaterThan(PlanStatus.ACTIVE, 0.0)).thenReturn(3L);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> planService.createPlan(dto));

        assertTrue(ex.getMessage().contains("3 active paid plans"));
        verify(repository, never()).save(any(Plan.class));
    }

    // =========================
    // UPDATE PLAN TEST
    // =========================

    @Test
    void shouldUpdatePlanSuccessfully() {
        Plan existing = new Plan();
        existing.setId(planId);
        existing.setName("Basic");
        existing.setPrice(120.0);
        existing.setStatus(PlanStatus.ACTIVE);

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

    @Test
    void shouldRejectReactivatingPaidPlanWhenThreeActivePaidPlansExist() {
        Plan existing = new Plan();
        existing.setId(planId);
        existing.setName("Silver");
        existing.setPrice(80.0);
        existing.setStatus(PlanStatus.INACTIVE);

        when(repository.findById(planId)).thenReturn(Optional.of(existing));
        when(repository.countByStatusAndPriceGreaterThan(PlanStatus.ACTIVE, 0.0)).thenReturn(3L);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> planService.enablePlan(planId));

        assertTrue(ex.getMessage().contains("3 active paid plans"));
        verify(repository, never()).save(any(Plan.class));
    }

    @Test
    void shouldRejectUpdatingInactiveFreePlanIntoFourthActivePaidPlan() {
        Plan existing = new Plan();
        existing.setId(planId);
        existing.setName("Trial");
        existing.setPrice(0.0);
        existing.setStatus(PlanStatus.INACTIVE);

        when(repository.findById(planId)).thenReturn(Optional.of(existing));
        when(repository.existsByName("Gold")).thenReturn(false);
        when(repository.countByStatusAndPriceGreaterThan(PlanStatus.ACTIVE, 0.0)).thenReturn(3L);

        PlanUpdateRequestDTO dto = new PlanUpdateRequestDTO();
        dto.setName("Gold");
        dto.setPrice(120.0);
        dto.setDurationInDays(30);
        dto.setStatus(PlanStatus.ACTIVE);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> planService.updatePlan(planId, dto));

        assertTrue(ex.getMessage().contains("3 active paid plans"));
        verify(repository, never()).save(any(Plan.class));
    }
}
