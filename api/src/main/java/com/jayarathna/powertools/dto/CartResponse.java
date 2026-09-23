package com.jayarathna.powertools.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        Integer cartId,
        List<CartItemResponse> items,
        Integer itemCount,
        Integer totalQuantity,
        BigDecimal totalAmount
) {
}