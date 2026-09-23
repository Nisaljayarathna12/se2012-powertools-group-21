package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.dto.LoginRequest;
import com.jayarathna.powertools.dto.LoginResponse;
import com.jayarathna.powertools.dto.ProfileRequest;
import com.jayarathna.powertools.dto.RegisterRequest;
import com.jayarathna.powertools.dto.UserResponse;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.service.AuthService;
import com.jayarathna.powertools.service.UserService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    public AuthController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new UserResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        User user = authService.currentUser(authorization);
        return ResponseEntity.ok(new UserResponse(user));
    }

    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ProfileRequest request) {
        User user = authService.currentUser(authorization);
        User updated = userService.updateProfile(user, request);
        return ResponseEntity.ok(new UserResponse(updated));
    }
}