package com.gym.membershipservice.application.mapper;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;

import java.util.List;

public class SubscriptionMapper {

    public static SubscriptionResponseDTO toDTO(Subscription sub) {
        return toDTO(sub, null);
    }

    public static SubscriptionResponseDTO toDTO(Subscription sub, String userEmail) {
        return new SubscriptionResponseDTO(
                sub.getId(),
                sub.getUserId(),
                userEmail,
                sub.getPlan().getId(),
                sub.getPlan().getName(),
                sub.getPlan().getPrice(),
                sub.getStatus(),
                sub.getStartDate(),
                sub.getEndDate(),
                sub.getFreezeStartDate(),
                sub.getFreezeEndDate()
        );
    }

    public static List<SubscriptionResponseDTO> toDTOList(List<Subscription> subs) {
        return subs.stream().map(SubscriptionMapper::toDTO).toList();
    }

    public static SubscriptionHistoryResponseDTO toHistoryDTO(SubscriptionHistory h) {
        return new SubscriptionHistoryResponseDTO(
                h.getId(),
                h.getSubscription().getId(),
                h.getPreviousStatus(),
                h.getNewStatus(),
                h.getChangedAt(),
                h.getChangedBy(),
                h.getNote()
        );
    }

    public static List<SubscriptionHistoryResponseDTO> toHistoryDTOList(List<SubscriptionHistory> list) {
        return list.stream().map(SubscriptionMapper::toHistoryDTO).toList();
    }
}