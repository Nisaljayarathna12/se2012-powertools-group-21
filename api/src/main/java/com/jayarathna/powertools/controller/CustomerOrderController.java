package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.service.AuthService;
import com.jayarathna.powertools.service.OrderService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customer")
@SecurityRequirement(name = "bearerAuth")
public class CustomerOrderController {

    private final AuthService authService;
    private final OrderService orderService;

    public CustomerOrderController(AuthService authService, OrderService orderService) {
        this.authService = authService;
        this.orderService = orderService;
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> orders(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        User customer = authService.currentUser(authorization);
        return ResponseEntity.ok(orderService.getCustomerOrders(customer.getUserId()));
    }
}