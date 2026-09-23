package com.jayarathna.powertools.dto;

import com.jayarathna.powertools.model.Order;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OrderResponse(
        Integer orderId,
        LocalDate orderDate,
        BigDecimal totalAmount,
        String status,
        String shippingAddress,
        String customerName
) {
    public OrderResponse(Order order) {
        this(
                order.getOrderId(),
                order.getOrderDate(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getShippingAddress(),
                order.getUser() != null ? order.getUser().getName() : null
        );
    }
}