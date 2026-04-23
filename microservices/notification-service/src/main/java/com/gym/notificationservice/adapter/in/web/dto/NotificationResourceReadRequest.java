package com.gym.notificationservice.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record NotificationResourceReadRequest(
        @NotBlank String resourceType,
        @NotBlank String resourceId
) {}
