package com.gym.notificationservice.adapter.in.kafka;

import com.gym.notificationservice.adapter.in.kafka.dto.PaymentCompletedMessage;
import com.gym.notificationservice.adapter.in.kafka.dto.PaymentFailedMessage;
import com.gym.notificationservice.adapter.out.email.MailService;
import com.gym.notificationservice.application.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class PaymentEventListener {

    private final NotificationService notificationService;
    private final MailService mailService;

    public PaymentEventListener(NotificationService notificationService, MailService mailService) {
        this.notificationService = notificationService;
        this.mailService = mailService;
    }

    @KafkaListener(
            topics = "payment.completed",
            groupId = "notification-service",
            containerFactory = "paymentCompletedKafkaListenerFactory"
    )
    public void handlePaymentCompleted(PaymentCompletedMessage message) {
        try {
            log.info("Received payment.completed for userId={}", message.getUserId());

            java.util.UUID userId = java.util.UUID.fromString(message.getUserId());

            notificationService.createNotification(
                    userId,
                    "Payment Successful",
                    "Your payment of " + message.getAmount() + " " + message.getCurrency()
                            + " was successful. Your subscription is now active.",
                    "PAYMENT_COMPLETED"
            );

            mailService.sendPaymentSuccessEmail(
                    message.getUserId(),
                    message.getAmount(),
                    message.getCurrency()
            );

        } catch (Exception e) {
            log.error("Failed to process payment.completed notification: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(
            topics = "payment.failed",
            groupId = "notification-service",
            containerFactory = "paymentFailedKafkaListenerFactory"
    )
    public void handlePaymentFailed(PaymentFailedMessage message) {
        try {
            log.info("Received payment.failed for userId={}", message.getUserId());

            java.util.UUID userId = java.util.UUID.fromString(message.getUserId());

            notificationService.createNotification(
                    userId,
                    "Payment Failed",
                    "Your payment could not be processed. Reason: " + message.getFailureReason(),
                    "PAYMENT_FAILED"
            );

        } catch (Exception e) {
            log.error("Failed to process payment.failed notification: {}", e.getMessage(), e);
        }
    }
}
