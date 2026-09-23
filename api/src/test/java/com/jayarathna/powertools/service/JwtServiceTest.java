package com.jayarathna.powertools.service;

import com.jayarathna.powertools.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-key-that-is-long-enough-for-hs256-signing";
    private static final long EXPIRATION_MS = 60_000;

    private final JwtService jwtService = new JwtService(SECRET, EXPIRATION_MS);

    @Test
    void generatedTokenRoundTripsClaims() {
        User user = new User("Alice", "alice@example.com", "pw", "CUSTOMER");
        user.setUserId(42);

        String token = jwtService.generateToken(user);
        assertNotNull(token);

        Claims claims = jwtService.parseToken(token);
        assertEquals("alice@example.com", claims.getSubject());
        assertEquals(42, claims.get("userId", Integer.class));
        assertEquals("CUSTOMER", claims.get("role", String.class));
    }

    @Test
    void expirationMsIsExposed() {
        assertEquals(EXPIRATION_MS, jwtService.getExpirationMs());
    }

    @Test
    void parseTokenRejectsTamperedToken() {
        User user = new User("Alice", "alice@example.com", "pw", "CUSTOMER");
        user.setUserId(42);

        String token = jwtService.generateToken(user);
        String tampered = token.substring(0, token.length() - 4) + "XXXX";

        assertThrows(JwtException.class, () -> jwtService.parseToken(tampered));
    }

    @Test
    void parseTokenRejectsGarbage() {
        assertThrows(JwtException.class, () -> jwtService.parseToken("not.a.jwt"));
    }

    @Test
    void tokenContentIsNotPlaintext() {
        User user = new User("Alice", "alice@example.com", "pw", "CUSTOMER");
        user.setUserId(42);

        String token = jwtService.generateToken(user);
        assertTrue(!token.contains("alice@example.com"));
        assertEquals(3, token.split("\\.").length);
    }
}