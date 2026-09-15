package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.LoginRequest;
import com.jayarathna.powertools.dto.LoginResponse;
import com.jayarathna.powertools.dto.ProfileRequest;
import com.jayarathna.powertools.dto.RegisterRequest;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private static final String ROLE_CUSTOMER = "CUSTOMER";
    private static final String PASSWORD_PATTERN = ".*[A-Za-z].*[0-9].*|.*[0-9].*[A-Za-z].*";
    private static final String INVALID_CREDENTIALS = "Invalid email or password";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtService = jwtService;
    }

    public User register(RegisterRequest request) {
        String name = request.getName().trim();
        String email = request.getEmail().trim().toLowerCase();
        String password = request.getPassword();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with this email already exists");
        }

        if (!password.matches(PASSWORD_PATTERN)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must contain at least one letter and one number");
        }

        User user = new User(name, email, passwordEncoder.encode(password), ROLE_CUSTOMER);
        return userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
        }

        String token = jwtService.generateToken(user);
        long expiresAt = System.currentTimeMillis() + jwtService.getExpirationMs();
        return new LoginResponse(token, expiresAt, user);
    }

    public User updateProfile(User user, ProfileRequest request) {
        String name = request.getName().trim();
        String email = request.getEmail().trim().toLowerCase();

        userRepository.findByEmail(email)
                .filter(existing -> !existing.getUserId().equals(user.getUserId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "An account with this email already exists");
                });

        user.setName(name);
        user.setEmail(email);
        return userRepository.save(user);
    }
}