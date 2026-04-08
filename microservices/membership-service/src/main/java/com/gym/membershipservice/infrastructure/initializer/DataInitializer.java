package com.gym.membershipservice.infrastructure.initializer;


import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PlanRepository planRepository;

    public DataInitializer(PlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if Free Plan exists
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
            System.out.println(" Free Plan already exists");
        }
    }
}