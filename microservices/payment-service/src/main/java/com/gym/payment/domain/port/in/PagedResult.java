package com.gym.payment.domain.port.in;

import java.util.List;

public record PagedResult<T>(
        List<T> items,
        int page,
        int pageSize,
        long totalItems
) {
    public int totalPages() {
        if (pageSize <= 0 || totalItems <= 0) {
            return 0;
        }
        return (int) Math.ceil((double) totalItems / pageSize);
    }

    public boolean hasNext() {
        return page < totalPages();
    }

    public boolean hasPrevious() {
        return page > 1;
    }
}
