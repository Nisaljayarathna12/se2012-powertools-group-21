package com.jayarathna.powertools.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Stable page envelope for the admin orders list. Mirrors the shape returned by
 * {@link ProductResponse} so clients never depend on Spring Data {@code PageImpl}
 * serialization details (e.g. {@code number}/{@code pageable}).
 */
public record AdminOrdersResponse(
        List<OrderResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static AdminOrdersResponse from(Page<OrderResponse> page) {
        return new AdminOrdersResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}