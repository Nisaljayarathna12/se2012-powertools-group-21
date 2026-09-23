package com.jayarathna.powertools.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Validates the request-form contract shared with the frontend: the exact payloads
 * {@code web/lib/api.ts} sends must satisfy the backend bean validation rules.
 */
class RequestContractValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        validatorFactory.close();
    }

    @Test
    void registerAcceptsFrontendPayloadAndRejectsWeakPassword() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alice Customer");
        request.setEmail("alice@example.com");
        request.setPassword("short");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));

        request.setPassword("correcthorse1");
        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void loginRequiresEmailAndPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("not-an-email");
        request.setPassword("secret");

        assertTrue(validator.validate(request).stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    void createProductRequiresValidPriceAndStock() {
        CreateProductRequest request = new CreateProductRequest(
                java.util.UUID.randomUUID(),
                "Cordless Drill",
                BigDecimal.ZERO,
                -1,
                null,
                null);

        Set<ConstraintViolation<CreateProductRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("price")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("stockQty")));
    }

    @Test
    void orderAndCartPayloadsMatchFrontendShapes() {
        AddCartItemRequest add = new AddCartItemRequest(7, 1);
        assertTrue(validator.validate(add).isEmpty());

        UpdateCartItemRequest update = new UpdateCartItemRequest(2);
        assertTrue(validator.validate(update).isEmpty());

        CreateOrderRequest order = new CreateOrderRequest("1 Main St", "Springfield", "62704", "+1 555 0100");
        assertTrue(validator.validate(order).isEmpty());

        UpdateOrderStatusRequest status = new UpdateOrderStatusRequest("SHIPPED");
        assertTrue(validator.validate(status).isEmpty());

        UpdateStockRequest stock = new UpdateStockRequest(-3);
        assertTrue(validator.validate(stock).isEmpty());
    }

    @Test
    void orderStatusMustNotBeBlank() {
        UpdateOrderStatusRequest status = new UpdateOrderStatusRequest("");
        assertFalse(validator.validate(status).isEmpty());
    }

    @Test
    void adminOrdersEnvelopeFieldNamesMatchFrontendType() {
        new AdminOrdersResponse(java.util.List.of(), 0, 10, 0, 0, true, true);
        assertEquals(7, AdminOrdersResponse.class.getRecordComponents().length);
    }
}