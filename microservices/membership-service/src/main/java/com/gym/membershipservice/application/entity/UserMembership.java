// UserMembership.java
package com.gym.membershipservice.application.entity;

import com.gym.membershipservice.application.enums.MembershipStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "user_memberships")
public class UserMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // reference to User-Service user

    @Enumerated(EnumType.STRING)
    private MembershipStatus status = MembershipStatus.ACTIVE;

    // additional fields if needed (like remainingDays)

    // getters & setters
}