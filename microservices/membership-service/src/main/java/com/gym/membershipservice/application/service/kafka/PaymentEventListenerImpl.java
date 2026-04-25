package com.gym.membershipservice.application.service.kafka;

import com.gym.membershipservice.application.dto.kafka.PaymentCompletedMessage;
import com.gym.membershipservice.application.dto.kafka.PaymentFailedMessage;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.SubscriptionHistoryService;
import com.gym.membershipservice.application.port.kafka.PaymentEventHandler;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
public class PaymentEventListenerImpl implements PaymentEventHandler {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryService historyService;

    public PaymentEventListenerImpl(SubscriptionRepository subscriptionRepository,
                                    SubscriptionHistoryService historyService) {
        this.subscriptionRepository = subscriptionRepository;
        this.historyService = historyService;
    }

    @KafkaListener(
            topics = "payment.completed",
            groupId = "membership-service-payment",
            containerFactory = "paymentCompletedKafkaListenerFactory"
    )
    @Override
    @Transactional
    public void handlePaymentCompleted(PaymentCompletedMessage message) {
        try {
            log.info("Received payment.completed for subscriptionId={}", message.getSubscriptionId());

            UUID subscriptionId = UUID.fromString(message.getSubscriptionId());

            Subscription sub = subscriptionRepository.findById(subscriptionId).orElse(null);
            if (sub == null) {
                log.error("Subscription not found for id={}", subscriptionId);
                return;
            }

            if (sub.getStatus() != SubscriptionStatus.PENDING_PAYMENT) {
                log.info("Subscription {} is already in status {}. Skipping.", subscriptionId, sub.getStatus());
                return;
            }

            SubscriptionStatus previous = sub.getStatus();
            String note = "Payment completed - membership activated";

            if (sub.getPendingPlan() != null) {
                var pendingPlan = sub.getPendingPlan();
                sub.setPlan(pendingPlan);
                sub.setPendingPlan(null);

                LocalDateTime now = LocalDateTime.now();
                sub.setStartDate(now);
                if (pendingPlan.getDurationInDays() != null && pendingPlan.getDurationInDays() > 0) {
                    sub.setEndDate(now.plusDays(pendingPlan.getDurationInDays()));
                } else {
                    sub.setEndDate(null);
                }

                note = "Payment completed - plan change activated to " + pendingPlan.getName();
            }

            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setPendingPaymentStartedAt(null);
            Subscription saved = subscriptionRepository.save(sub);
            historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null, note);

            log.info("Subscription {} activated after successful payment", subscriptionId);

        } catch (Exception e) {
            log.error("Failed to process payment.completed: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(
            topics = "payment.failed",
            groupId = "membership-service-payment",
            containerFactory = "paymentFailedKafkaListenerFactory"
    )
    @Override
    @Transactional
    public void handlePaymentFailed(PaymentFailedMessage message) {
        try {
            log.info("Received payment.failed for subscriptionId={}", message.getSubscriptionId());

            UUID subscriptionId = UUID.fromString(message.getSubscriptionId());

            Subscription sub = subscriptionRepository.findById(subscriptionId).orElse(null);
            if (sub == null) {
                log.error("Subscription not found for id={}", subscriptionId);
                return;
            }

            if (sub.getStatus() != SubscriptionStatus.PENDING_PAYMENT) {
                log.info("Subscription {} is already in status {}. Skipping.", subscriptionId, sub.getStatus());
                return;
            }

            SubscriptionStatus previous = sub.getStatus();
            String note = "Payment failed";
            if (sub.getPendingPlan() != null) {
                note = "Payment failed for pending plan change to " + sub.getPendingPlan().getName();
                sub.setPendingPlan(null);
            }
            sub.setStatus(SubscriptionStatus.PAYMENT_FAILED);
            sub.setPendingPaymentStartedAt(null);
            Subscription saved = subscriptionRepository.save(sub);
            historyService.recordChange(saved, previous, SubscriptionStatus.PAYMENT_FAILED, null, note);

            log.info("Subscription {} marked as PAYMENT_FAILED. Reason: {}", subscriptionId, message.getFailureReason());

        } catch (Exception e) {
            log.error("Failed to process payment.failed: {}", e.getMessage(), e);
        }
    }
}
