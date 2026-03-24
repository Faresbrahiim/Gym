// Plan.java
package com.gym.membershipservice.application.entity;

import com.gym.membershipservice.application.enums.PlanStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "plans")
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private Double price;
    private Integer durationInDays;

    @Enumerated(EnumType.STRING)
    private PlanStatus status = PlanStatus.ACTIVE;

}