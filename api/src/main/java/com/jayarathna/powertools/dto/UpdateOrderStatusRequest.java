package com.jayarathna.powertools.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateOrderStatusRequest(
        @NotBlank(message = "Status is required") String status
) {
}