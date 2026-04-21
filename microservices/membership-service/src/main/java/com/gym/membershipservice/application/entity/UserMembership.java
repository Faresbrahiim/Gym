package com.gym.membershipservice.application.entity;

import com.gym.membershipservice.application.enums.MembershipStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "user_memberships", indexes = {
        @Index(name = "idx_user_membership_user_id", columnList = "user_id")
})
public class UserMembership {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "email")
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipStatus status = MembershipStatus.ACTIVE;

    public UserMembership() {}

    public UserMembership(UUID userId, String email) {
        this.userId = userId;
        this.email  = email;
    }

    // Getters & Setters
    public UUID getId() { return id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public MembershipStatus getStatus() { return status; }
    public void setStatus(MembershipStatus status) { this.status = status; }
}