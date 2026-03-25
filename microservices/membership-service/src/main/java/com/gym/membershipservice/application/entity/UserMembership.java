package com.gym.membershipservice.application.entity;

import com.gym.membershipservice.application.enums.MembershipStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "user_memberships", indexes = {
        @Index(name = "idx_user_membership_user_id", columnList = "user_id")
})
public class UserMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipStatus status = MembershipStatus.ACTIVE;

    // Getters & Setters
    public Long getId() { return id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public MembershipStatus getStatus() { return status; }
    public void setStatus(MembershipStatus status) { this.status = status; }
}