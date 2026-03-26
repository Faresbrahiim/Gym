package com.gym.membershipservice.application.dto;

import java.util.UUID;

public class PlanResponseDTO {

    private UUID id;
    private String name;
    private String description;
    private Double price;
    private Integer durationInDays;
    private String status;


    public PlanResponseDTO(UUID id, String name, String description,
                           Double price, Integer durationInDays, String status) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.durationInDays = durationInDays;
        this.status = status;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Double getPrice() { return price; }
    public Integer getDurationInDays() { return durationInDays; }
    public String getStatus() { return status; }
}