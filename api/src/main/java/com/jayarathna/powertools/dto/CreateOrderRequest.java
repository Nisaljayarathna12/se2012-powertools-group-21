package com.jayarathna.powertools.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateOrderRequest(
        @NotBlank(message = "Street address is required") String street,
        @NotBlank(message = "City is required") String city,
        @NotBlank(message = "Postal code is required") String postalCode,
        @NotBlank(message = "Phone number is required") String phone
) {
}