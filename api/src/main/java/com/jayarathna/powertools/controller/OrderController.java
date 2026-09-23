package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.dto.CreateOrderRequest;
import com.jayarathna.powertools.dto.OrderDetailResponse;
import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.service.AuthService;
import com.jayarathna.powertools.service.OrderService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final AuthService authService;
    private final OrderService orderService;

    public OrderController(AuthService authService, OrderService orderService) {
        this.authService = authService;
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderDetailResponse> createOrder(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CreateOrderRequest request) {
        User user = authService.currentUser(authorization);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(user, request));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        User user = authService.currentUser(authorization);
        return ResponseEntity.ok(orderService.getCustomerOrders(user.getUserId()));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDetailResponse> getOrder(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Integer orderId) {
        User user = authService.currentUser(authorization);
        return ResponseEntity.ok(orderService.getOrder(user, orderId));
    }
}