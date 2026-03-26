package com.gym.membershipservice.api.mapper;

import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.dto.PlanResponseDTO;

import java.util.List;
import java.util.stream.Collectors;

public class PlanMapper {

    public static PlanResponseDTO toDTO(Plan plan) {
        return new PlanResponseDTO(
                plan.getId(),
                plan.getName(),
                plan.getDescription(),
                plan.getPrice(),
                plan.getDurationInDays(),
                plan.getStatus().name()
        );
    }

    public static List<PlanResponseDTO> toDTOList(List<Plan> plans) {
        return plans.stream()
                .map(PlanMapper::toDTO)
                .collect(Collectors.toList());
    }
}