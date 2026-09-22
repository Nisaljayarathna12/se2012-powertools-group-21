package com.jayarathna.powertools.dto;

public record CartCountResponse(
        Integer itemCount,
        Integer totalQuantity
) {
}