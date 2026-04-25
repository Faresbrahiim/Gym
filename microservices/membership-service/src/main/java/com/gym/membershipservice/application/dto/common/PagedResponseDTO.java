package com.gym.membershipservice.application.dto.common;

import java.util.List;

public record PagedResponseDTO<T>(
        List<T> items,
        int page,
        int pageSize,
        long totalItems,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
    public static <T> PagedResponseDTO<T> of(List<T> items, int page, int pageSize, long totalItems) {
        int totalPages = pageSize <= 0 || totalItems <= 0
                ? 0
                : (int) Math.ceil((double) totalItems / pageSize);

        return new PagedResponseDTO<>(
                items,
                page,
                pageSize,
                totalItems,
                totalPages,
                page < totalPages,
                page > 1
        );
    }
}
