package com.jayarathna.powertools.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateStockRequest(
        @NotNull(message = "Adjustment is required") Integer adjustment
) {
}