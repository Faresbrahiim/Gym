package com.gym.notificationservice.adapter.in.web;

import com.gym.notificationservice.adapter.in.web.dto.NotificationResponse;
import com.gym.notificationservice.adapter.in.web.dto.NotificationResourceReadRequest;
import com.gym.notificationservice.application.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/me")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(JwtAuthenticationToken token) {
        UUID userId = UUID.fromString(token.getToken().getSubject());
        return ResponseEntity.ok(notificationService.getMyNotifications(userId));
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(JwtAuthenticationToken token) {
        UUID userId = UUID.fromString(token.getToken().getSubject());
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable UUID id, JwtAuthenticationToken token) {
        UUID userId = UUID.fromString(token.getToken().getSubject());
        return ResponseEntity.ok(notificationService.markAsRead(id, userId));
    }

    @PostMapping("/me/read-all")
    public ResponseEntity<Void> markAllAsRead(JwtAuthenticationToken token) {
        UUID userId = UUID.fromString(token.getToken().getSubject());
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/read-resource")
    public ResponseEntity<Void> markResourceAsRead(
            @Valid @RequestBody NotificationResourceReadRequest request,
            JwtAuthenticationToken token
    ) {
        UUID userId = UUID.fromString(token.getToken().getSubject());
        notificationService.markByResourceAsRead(userId, request.resourceType(), request.resourceId());
        return ResponseEntity.noContent().build();
    }
}
