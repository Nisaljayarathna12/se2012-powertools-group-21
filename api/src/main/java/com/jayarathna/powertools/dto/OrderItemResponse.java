package com.jayarathna.powertools.dto;

import com.jayarathna.powertools.model.OrderItem;

import java.math.BigDecimal;

public record OrderItemResponse(
        Integer orderItemId,
        Integer productId,
        String name,
        Integer quantity,
        BigDecimal unitPrice,
        String imageUrl,
        BigDecimal lineTotal
) {
    public OrderItemResponse(OrderItem item) {
        this(
                item.getOrderItemId(),
                item.getProduct().getProductId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getProduct().getImageUrl(),
                item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
        );
    }
}