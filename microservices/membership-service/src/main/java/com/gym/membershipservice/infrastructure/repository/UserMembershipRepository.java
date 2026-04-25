package com.gym.membershipservice.infrastructure.repository;

import com.gym.membershipservice.application.entity.UserMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserMembershipRepository extends JpaRepository<UserMembership, UUID> {
    Optional<UserMembership> findByUserId(UUID userId);
    List<UserMembership> findByUserIdIn(Collection<UUID> userIds);
    List<UserMembership> findByEmailContainingIgnoreCase(String email);
}
