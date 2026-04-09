package com.gym.membershipservice.application.dto.Plan;
import  com.gym.membershipservice.application.enums.PlanStatus;


public class PlanUpdateRequestDTO {

    private String name;
    private String description;
    private Double price;
    private Integer durationInDays;
    private PlanStatus status;

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Double getPrice() {
        return price;
    }

    public Integer getDurationInDays() {
        return durationInDays;
    }

    public PlanStatus getStatus() {
        return status;
    }
}