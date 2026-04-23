package com.gym.payment.adapter.in.web.dto;

import java.util.List;

public record PagedResponse<T>(
        List<T> items,
        int page,
        int pageSize,
        long totalItems,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
    public static <T> PagedResponse<T> of(List<T> items, int page, int pageSize, long totalItems) {
        int totalPages = pageSize <= 0 || totalItems <= 0
                ? 0
                : (int) Math.ceil((double) totalItems / pageSize);

        return new PagedResponse<>(
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
