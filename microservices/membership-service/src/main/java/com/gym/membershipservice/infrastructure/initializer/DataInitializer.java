package com.gym.membershipservice.infrastructure.initializer;

import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.enums.PlanCapability;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PlanRepository planRepository;

    public DataInitializer(PlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @Override
    public void run(String... args) {
        boolean exists = planRepository.findByStatusAndName(PlanStatus.ACTIVE, "Free").isPresent();
        if (!exists) {
            Plan freePlan = new Plan();
            freePlan.setName("Free");
            freePlan.setDescription("Default free plan for new users");
            freePlan.setPrice(0.0);
            freePlan.setDurationInDays(0);
            freePlan.setStatus(PlanStatus.ACTIVE);

            planRepository.save(freePlan);
            System.out.println("Free Plan inserted");
        } else {
            System.out.println("Free Plan already exists");
        }

        initializePaidPlanCapabilities();
    }

    private void initializePaidPlanCapabilities() {
        List<Plan> activePaidPlans = planRepository.findByStatus(PlanStatus.ACTIVE).stream()
                .filter(plan -> plan.getPrice() != null && plan.getPrice() > 0)
                .sorted(Comparator.comparing(Plan::getPrice))
                .toList();

        if (activePaidPlans.isEmpty()) {
            return;
        }

        boolean alreadyConfigured = activePaidPlans.stream()
                .anyMatch(plan -> plan.getCapabilities() != null && !plan.getCapabilities().isEmpty());
        if (alreadyConfigured) {
            return;
        }

        for (int index = 0; index < activePaidPlans.size(); index++) {
            Plan plan = activePaidPlans.get(index);
            List<PlanCapability> capabilities = new ArrayList<>();
            if (index >= 1) {
                capabilities.add(PlanCapability.SESSION_BOOKING);
            }
            if (index >= 2) {
                capabilities.add(PlanCapability.AI_COACH);
            }

            plan.setCapabilities(capabilities);
            planRepository.save(plan);
        }
    }
}
