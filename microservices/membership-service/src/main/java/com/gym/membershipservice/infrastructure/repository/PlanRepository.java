package com.gym.membershipservice.infrastructure.repository;

import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.enums.PlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {

    List<Plan> findByStatus(PlanStatus status);
}