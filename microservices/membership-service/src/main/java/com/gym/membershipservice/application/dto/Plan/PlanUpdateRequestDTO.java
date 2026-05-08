package com.gym.membershipservice.application.dto.Plan;

import com.gym.membershipservice.application.enums.PlanStatus;
import jakarta.validation.constraints.*;
import java.util.List;

public class PlanUpdateRequestDTO {

    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 500)
    private String description;

    @Positive
    private Double price;

    @Min(1)
    private Integer durationInDays;

    private PlanStatus status;

    @Size(min = 1)
    private List<@NotBlank String> features;

    @Size(min = 1)
    private List<@NotBlank String> capabilities;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Integer getDurationInDays() {
        return durationInDays;
    }

    public void setDurationInDays(Integer durationInDays) {
        this.durationInDays = durationInDays;
    }

    public PlanStatus getStatus() {
        return status;
    }

    public void setStatus(PlanStatus status) {
        this.status = status;
    }

    public List<String> getFeatures() { return features; }
    public void setFeatures(List<String> features) { this.features = features; }

    public List<String> getCapabilities() { return capabilities; }
    public void setCapabilities(List<String> capabilities) { this.capabilities = capabilities; }
}
