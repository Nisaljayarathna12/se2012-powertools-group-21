package com.jayarathna.powertools.service;

import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.UserRepository;
import io.jsonwebtoken.impl.DefaultClaims;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    private static User admin() {
        User user = new User("Admin", "admin@powertools.com", "pw", "ADMIN");
        user.setUserId(1);
        return user;
    }

    @Test
    void currentUserReturnsUserForValidBearerToken() {
        when(jwtService.parseToken("abc.def.ghi"))
                .thenReturn(new DefaultClaims(Map.of("userId", 1)));
        when(userRepository.findById(1)).thenReturn(Optional.of(admin()));

        User user = authService.currentUser("Bearer abc.def.ghi");

        assertEquals(1, user.getUserId());
        assertEquals("admin@powertools.com", user.getEmail());
    }

    @Test
    void currentUserRejectsMissingHeader() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.currentUser(null));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void currentUserRejectsNonBearerHeader() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.currentUser("Basic dXNlcjpwdw=="));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void currentUserRejectsBlankToken() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.currentUser("Bearer   "));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void currentUserRejectsInvalidToken() {
        when(jwtService.parseToken("bad"))
                .thenThrow(new io.jsonwebtoken.MalformedJwtException("bad"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.currentUser("Bearer bad"));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void currentUserRejectsTokenWithoutUserIdClaim() {
        when(jwtService.parseToken("no.user"))
                .thenReturn(new DefaultClaims(Map.of("role", "ADMIN")));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.currentUser("Bearer no.user"));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void currentUserRejectsUnknownUser() {
        when(jwtService.parseToken("ghost"))
                .thenReturn(new DefaultClaims(Map.of("userId", 999)));
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.currentUser("Bearer ghost"));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }
}