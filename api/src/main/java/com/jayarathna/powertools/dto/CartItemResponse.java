package com.jayarathna.powertools.dto;

import com.jayarathna.powertools.model.CartItem;

import java.math.BigDecimal;

public record CartItemResponse(
        Integer cartItemId,
        Integer productId,
        String name,
        BigDecimal price,
        Integer quantity,
        String imageUrl,
        Integer stockQty,
        BigDecimal lineTotal
) {
    public CartItemResponse(CartItem item) {
        this(
                item.getCartItemId(),
                item.getProduct().getProductId(),
                item.getProduct().getName(),
                item.getProduct().getPrice(),
                item.getQuantity(),
                item.getProduct().getImageUrl(),
                item.getProduct().getStockQty(),
                item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
        );
    }
}