package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.dto.AddCartItemRequest;
import com.jayarathna.powertools.dto.CartCountResponse;
import com.jayarathna.powertools.dto.CartResponse;
import com.jayarathna.powertools.dto.UpdateCartItemRequest;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.service.AuthService;
import com.jayarathna.powertools.service.CartService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    private final AuthService authService;
    private final CartService cartService;

    public CartController(AuthService authService, CartService cartService) {
        this.authService = authService;
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        User user = authService.currentUser(authorization);
        return ResponseEntity.ok(cartService.getCart(user));
    }

    @GetMapping("/count")
    public ResponseEntity<CartCountResponse> getCount(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        User user = authService.currentUser(authorization);
        return ResponseEntity.ok(cartService.getCount(user));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody AddCartItemRequest request) {
        User user = authService.currentUser(authorization);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cartService.addItem(user, request.productId(), request.quantity()));
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> updateItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable int cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        User user = authService.currentUser(authorization);
        return ResponseEntity.ok(cartService.updateItemQuantity(user, cartItemId, request.quantity()));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> removeItem(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable int cartItemId) {
        User user = authService.currentUser(authorization);
        return ResponseEntity.ok(cartService.removeItem(user, cartItemId));
    }
}