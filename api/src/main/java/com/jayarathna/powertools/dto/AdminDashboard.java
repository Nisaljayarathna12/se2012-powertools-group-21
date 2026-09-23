package com.jayarathna.powertools.dto;

import java.util.List;

public record AdminDashboard(
        UserResponse user,
        long products,
        long orders,
        long customers,
        long lowStockCount,
        List<OrderResponse> recentOrders,
        List<ProductDto> lowStockProducts
) {
}