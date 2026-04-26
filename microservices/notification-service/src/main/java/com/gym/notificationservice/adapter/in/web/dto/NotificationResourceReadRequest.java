package com.gym.notificationservice.adapter.in.web.dto;

import com.gym.notificationservice.domain.NotificationResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotificationResourceReadRequest(
        @NotNull NotificationResourceType resourceType,
        @NotBlank String resourceId
) {}
