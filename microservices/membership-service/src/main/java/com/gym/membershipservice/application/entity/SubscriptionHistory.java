package com.gym.membershipservice.application.entity;

import com.gym.membershipservice.application.enums.SubscriptionStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "subscription_history")
public class SubscriptionHistory {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    //  relation to Subscription
    @ManyToOne(optional = false)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status")
    private SubscriptionStatus previousStatus;


    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false)
    private SubscriptionStatus newStatus;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    // optional (can remove for now if you want)
    @Column(name = "changed_by")
    private UUID changedBy;

    private String note;

    public UUID getId() { return id; }

    public Subscription getSubscription() { return subscription; }
    public void setSubscription(Subscription subscription) { this.subscription = subscription; }

    public SubscriptionStatus getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(SubscriptionStatus previousStatus) { this.previousStatus = previousStatus; }

    public SubscriptionStatus getNewStatus() { return newStatus; }
    public void setNewStatus(SubscriptionStatus newStatus) { this.newStatus = newStatus; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }

    public UUID getChangedBy() { return changedBy; }
    public void setChangedBy(UUID changedBy) { this.changedBy = changedBy; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}