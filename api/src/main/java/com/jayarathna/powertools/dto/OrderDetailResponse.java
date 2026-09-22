package com.jayarathna.powertools.dto;

import com.jayarathna.powertools.model.Order;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record OrderDetailResponse(
        Integer orderId,
        LocalDate orderDate,
        BigDecimal totalAmount,
        String status,
        String shippingAddress,
        String customerName,
        List<OrderItemResponse> items
) {
    public OrderDetailResponse(Order order, List<OrderItemResponse> items) {
        this(
                order.getOrderId(),
                order.getOrderDate(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getShippingAddress(),
                order.getUser() != null ? order.getUser().getName() : null,
                items
        );
    }
}