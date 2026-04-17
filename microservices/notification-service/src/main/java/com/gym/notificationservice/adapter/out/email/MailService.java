package com.gym.notificationservice.adapter.out.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPaymentSuccessEmail(String to, String amount, String currency) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(from);
            mail.setTo(to);
            mail.setSubject("Payment Confirmed");
            mail.setText(
                    "Your payment of " + amount + " " + currency +
                    " was successful.\n\nYour membership is now active.\n\nThank you!"
            );
            mailSender.send(mail);
            log.info("Payment success email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send payment success email to {}: {}", to, e.getMessage(), e);
        }
    }
}
