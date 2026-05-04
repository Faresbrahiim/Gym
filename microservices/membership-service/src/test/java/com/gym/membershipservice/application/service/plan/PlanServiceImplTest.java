package com.gym.membershipservice.application.service.plan;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.application.dto.Plan.PlanRequestDTO;
import com.gym.membershipservice.application.dto.Plan.PlanUpdateRequestDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.enums.PlanCapability;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    @Test
    void shouldCreatePlanSuccessfully() {
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(100.0);
        dto.setDurationInDays(30);
        dto.setCapabilities(List.of("SESSION_BOOKING", "AI_COACH"));

        when(repository.existsByName("Premium")).thenReturn(false);
        when(repository.findByStatus(PlanStatus.ACTIVE)).thenReturn(List.of(
                activePaidPlan("Standard", 60.0, List.of()),
                activePaidPlan("Pro", 80.0, List.of(PlanCapability.SESSION_BOOKING))
        ));

        Plan savedPlan = new Plan();
        savedPlan.setId(planId);
        savedPlan.setName("Premium");
        savedPlan.setPrice(100.0);
        savedPlan.setCapabilities(List.of(PlanCapability.SESSION_BOOKING, PlanCapability.AI_COACH));

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

        assertThrows(ConflictException.class, () -> planService.createPlan(dto));
    }

    @Test
    void shouldThrowBadRequestIfPriceNegative() {
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(-10.0);
        dto.setDurationInDays(30);

        assertThrows(BadRequestException.class, () -> planService.createPlan(dto));
    }

    @Test
    void shouldRejectCreatingFourthActivePaidPlan() {
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(100.0);
        dto.setDurationInDays(30);
        dto.setCapabilities(List.of("SESSION_BOOKING", "AI_COACH"));

        when(repository.existsByName("Premium")).thenReturn(false);
        when(repository.findByStatus(PlanStatus.ACTIVE)).thenReturn(List.of(
                activePaidPlan("Basic+", 40.0, List.of()),
                activePaidPlan("Standard", 80.0, List.of(PlanCapability.SESSION_BOOKING)),
                activePaidPlan("Premium", 120.0, List.of(PlanCapability.SESSION_BOOKING, PlanCapability.AI_COACH))
        ));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> planService.createPlan(dto));

        assertTrue(ex.getMessage().contains("3 active paid plans"));
        verify(repository, never()).save(any(Plan.class));
    }

    @Test
    void shouldRejectCreatingDuplicatePremiumTierPlan() {
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Elite");
        dto.setPrice(150.0);
        dto.setDurationInDays(30);
        dto.setCapabilities(List.of("SESSION_BOOKING", "AI_COACH"));

        when(repository.existsByName("Elite")).thenReturn(false);
        when(repository.findByStatus(PlanStatus.ACTIVE)).thenReturn(List.of(
                activePaidPlan("Starter", 50.0, List.of()),
                activePaidPlan("Elite Existing", 140.0, List.of(PlanCapability.SESSION_BOOKING, PlanCapability.AI_COACH))
        ));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> planService.createPlan(dto));

        assertTrue(ex.getMessage().contains("premium tier"));
    }

    @Test
    void shouldRejectCreatingAiCoachPlanWithoutSessionBooking() {
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Broken");
        dto.setPrice(120.0);
        dto.setDurationInDays(30);
        dto.setCapabilities(List.of("AI_COACH"));

        when(repository.existsByName("Broken")).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> planService.createPlan(dto));

        assertTrue(ex.getMessage().contains("AI Coach"));
    }

    @Test
    void shouldRejectCreatingPremiumTierBeforeLowerTiersExist() {
        PlanRequestDTO dto = new PlanRequestDTO();
        dto.setName("Premium");
        dto.setPrice(120.0);
        dto.setDurationInDays(30);
        dto.setCapabilities(List.of("SESSION_BOOKING", "AI_COACH"));

        when(repository.existsByName("Premium")).thenReturn(false);
        when(repository.findByStatus(PlanStatus.ACTIVE)).thenReturn(List.of(
                activePaidPlan("Basic+", 40.0, List.of())
        ));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> planService.createPlan(dto));

        assertTrue(ex.getMessage().contains("lower tiers"));
    }

    @Test
    void shouldUpdatePlanSuccessfully() {
        Plan existing = activePaidPlan("Standard", 80.0, List.of(PlanCapability.SESSION_BOOKING));
        existing.setId(planId);

        when(repository.findById(planId)).thenReturn(Optional.of(existing));
        when(repository.existsByName("Standard Plus")).thenReturn(false);
        when(repository.findByStatus(PlanStatus.ACTIVE)).thenReturn(List.of(
                activePaidPlan("Basic+", 40.0, List.of()),
                activePaidPlan("Premium", 120.0, List.of(PlanCapability.SESSION_BOOKING, PlanCapability.AI_COACH))
        ));
        when(repository.save(any(Plan.class))).thenReturn(existing);

        PlanUpdateRequestDTO dto = new PlanUpdateRequestDTO();
        dto.setName("Standard Plus");
        dto.setPrice(85.0);
        dto.setDurationInDays(30);
        dto.setStatus(PlanStatus.ACTIVE);
        dto.setCapabilities(List.of("SESSION_BOOKING"));

        var result = planService.updatePlan(planId, dto);

        assertNotNull(result);
        verify(repository).save(existing);
    }

    @Test
    void shouldRejectUpdatingPlanWhenPriceBreaksTierOrder() {
        Plan existing = activePaidPlan("Standard", 80.0, List.of(PlanCapability.SESSION_BOOKING));
        existing.setId(planId);

        when(repository.findById(planId)).thenReturn(Optional.of(existing));
        when(repository.existsByName("Standard")).thenReturn(false);
        when(repository.findByStatus(PlanStatus.ACTIVE)).thenReturn(List.of(
                activePaidPlan("Basic+", 40.0, List.of()),
                activePaidPlan("Premium", 120.0, List.of(PlanCapability.SESSION_BOOKING, PlanCapability.AI_COACH))
        ));

        PlanUpdateRequestDTO dto = new PlanUpdateRequestDTO();
        dto.setName("Standard");
        dto.setPrice(130.0);
        dto.setDurationInDays(30);
        dto.setStatus(PlanStatus.ACTIVE);
        dto.setCapabilities(List.of("SESSION_BOOKING"));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> planService.updatePlan(planId, dto));

        assertTrue(ex.getMessage().contains("cheaper"));
    }

    @Test
    void shouldRejectReactivatingPaidPlanWhenPremiumTierAlreadyExists() {
        Plan existing = activePaidPlan("Premium Legacy", 120.0, List.of(PlanCapability.SESSION_BOOKING, PlanCapability.AI_COACH));
        existing.setId(planId);
        existing.setStatus(PlanStatus.INACTIVE);

        when(repository.findById(planId)).thenReturn(Optional.of(existing));
        when(repository.findByStatus(PlanStatus.ACTIVE)).thenReturn(List.of(
                activePaidPlan("Basic+", 40.0, List.of()),
                activePaidPlan("Standard", 80.0, List.of(PlanCapability.SESSION_BOOKING)),
                activePaidPlan("Premium", 120.0, List.of(PlanCapability.SESSION_BOOKING, PlanCapability.AI_COACH))
        ));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> planService.enablePlan(planId));

        assertTrue(ex.getMessage().contains("3 active paid plans"));
        verify(repository, never()).save(any(Plan.class));
    }

    private Plan activePaidPlan(String name, double price, List<PlanCapability> capabilities) {
        Plan plan = new Plan();
        plan.setId(UUID.randomUUID());
        plan.setName(name);
        plan.setPrice(price);
        plan.setDurationInDays(30);
        plan.setStatus(PlanStatus.ACTIVE);
        plan.setCapabilities(capabilities);
        return plan;
    }
}
