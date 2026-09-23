package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.LoginRequest;
import com.jayarathna.powertools.dto.LoginResponse;
import com.jayarathna.powertools.dto.ProfileRequest;
import com.jayarathna.powertools.dto.RegisterRequest;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private RegisterRequest registerRequest(String name, String email, String password) {
        RegisterRequest request = new RegisterRequest();
        request.setName(name);
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    @Test
    void registerStoresNormalizedCustomer() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass123")).thenReturn("encoded");
        when(userRepository.save(org.mockito.ArgumentMatchers.any(User.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        User saved = userService.register(registerRequest("  Alice  ", "  Alice@Example.COM ", "pass123"));

        assertEquals("Alice", saved.getName());
        assertEquals("alice@example.com", saved.getEmail());
        assertEquals("encoded", saved.getPassword());
        assertEquals("CUSTOMER", saved.getRole());
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.findByEmail("alice@example.com"))
                .thenReturn(Optional.of(new User("Other", "alice@example.com", "x", "CUSTOMER")));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.register(registerRequest("Alice", "Alice@Example.com", "pass123")));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any(User.class));
    }

    @Test
    void registerRejectsPasswordWithoutLetterAndNumber() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.register(registerRequest("Alice", "alice@example.com", "onlyletters")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void loginReturnsTokenAndExpiry() {
        User user = new User("Alice", "alice@example.com", "encoded", "CUSTOMER");
        user.setUserId(7);
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass123", "encoded")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("token-abc");
        when(jwtService.getExpirationMs()).thenReturn(1000L);

        LoginRequest request = new LoginRequest();
        request.setEmail("  Alice@Example.COM ");
        request.setPassword("pass123");

        LoginResponse response = userService.login(request);

        assertEquals("token-abc", response.getToken());
        assertEquals(7, response.getUserId());
        assertEquals("alice@example.com", response.getEmail());
        assertTrue(response.getExpiresAt() > System.currentTimeMillis());
    }

    @Test
    void loginRejectsUnknownEmail() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest();
        request.setEmail("ghost@example.com");
        request.setPassword("pass123");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.login(request));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void loginRejectsWrongPassword() {
        User user = new User("Alice", "alice@example.com", "encoded", "CUSTOMER");
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("wrong");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.login(request));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(jwtService, never()).generateToken(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateProfileUpdatesOwnAccount() {
        User user = new User("Alice", "alice@example.com", "pw", "CUSTOMER");
        user.setUserId(3);

        when(userRepository.findByEmail("alice.new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(user)).thenReturn(user);

        ProfileRequest request = new ProfileRequest();
        request.setName("Alice New");
        request.setEmail("  Alice.New@Example.com ");

        User updated = userService.updateProfile(user, request);

        assertEquals("Alice New", updated.getName());
        assertEquals("alice.new@example.com", updated.getEmail());
    }

    @Test
    void updateProfileRejectsEmailOwnedByAnotherUser() {
        User user = new User("Alice", "alice@example.com", "pw", "CUSTOMER");
        user.setUserId(3);
        User other = new User("Bob", "bob@example.com", "pw", "CUSTOMER");
        other.setUserId(9);

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(other));

        ProfileRequest request = new ProfileRequest();
        request.setName("Alice");
        request.setEmail("bob@example.com");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.updateProfile(user, request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any(User.class));
    }
}