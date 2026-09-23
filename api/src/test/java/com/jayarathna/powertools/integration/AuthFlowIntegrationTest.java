package com.jayarathna.powertools.integration;

import com.jayarathna.powertools.dto.LoginRequest;
import com.jayarathna.powertools.dto.LoginResponse;
import com.jayarathna.powertools.dto.ProfileRequest;
import com.jayarathna.powertools.dto.RegisterRequest;
import com.jayarathna.powertools.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Full-stack walk through the auth endpoints against a real database:
 * registration rules, login, token-based profile access and update, plus
 * security responses for missing/invalid credentials.
 */
class AuthFlowIntegrationTest extends IntegrationTestBase {

    @Test
    void registerCreatesCustomerAccount() {
        ResponseEntity<UserResponse> response = post("/api/auth/register", null, registerBody(customerEmail()), UserResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUserId()).isNotNull();
        assertThat(response.getBody().getRole()).isEqualTo("CUSTOMER");
        assertThat(response.getBody().getEmail()).isNotBlank();
    }

    @Test
    void registerNormalizesEmailToLowercase() {
        ResponseEntity<UserResponse> response =
                post("/api/auth/register", null, registerBody("Alice@Example.COM"), UserResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    void duplicateEmailRegistrationIsRejected() {
        String email = customerEmail();
        registerCustomer(email);

        ResponseEntity<Map> response =
                post("/api/auth/register", null, registerBody(email), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void invalidRegistrationPayloadsAreRejected() {
        ResponseEntity<Map> missingEmail = post("/api/auth/register", null,
                Map.of("name", "No Mail", "email", "", "password", "password123"), Map.class);
        assertThat(missingEmail.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> badEmail = post("/api/auth/register", null,
                Map.of("name", "Bad Mail", "email", "not-an-email", "password", "password123"), Map.class);
        assertThat(badEmail.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> shortPassword = post("/api/auth/register", null,
                Map.of("name", "Short", "email", customerEmail(), "password", "abc"), Map.class);
        assertThat(shortPassword.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> noNumberPassword = post("/api/auth/register", null,
                Map.of("name", "No Number", "email", customerEmail(), "password", "lettersonly"), Map.class);
        assertThat(noNumberPassword.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void loginReturnsTokenAndRoleAfterRegistration() {
        String email = customerEmail();
        registerCustomer(email);

        ResponseEntity<LoginResponse> login = login(email, "password123");
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(login.getBody().getToken()).isNotBlank();
        assertThat(login.getBody().getRole()).isEqualTo("CUSTOMER");
        assertThat(login.getBody().getEmail()).isEqualTo(email);
        assertThat(login.getBody().getExpiresAt()).isGreaterThan(System.currentTimeMillis());
    }

    @Test
    void loginWithWrongCredentialsIsRejected() {
        String email = customerEmail();
        registerCustomer(email);

        ResponseEntity<Map> wrongPassword = loginRaw(email, "wrongpass1");
        assertThat(wrongPassword.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<Map> unknownEmail = loginRaw("nobody." + System.nanoTime() + "@example.com", "password123");
        assertThat(unknownEmail.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void profileRoundTripReturnsAndUpdatesOwnData() {
        String email = customerEmail();
        registerCustomer(email);
        String token = loginAndToken(email, "password123");

        ResponseEntity<UserResponse> profile = get("/api/auth/profile", token, UserResponse.class);
        assertThat(profile.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(profile.getBody().getEmail()).isEqualTo(email);
        assertThat(profile.getBody().getRole()).isEqualTo("CUSTOMER");

        ProfileRequest update = new ProfileRequest();
        update.setName("Renamed Customer");
        update.setEmail("renamed." + System.nanoTime() + "@example.com");
        ResponseEntity<UserResponse> updated = put("/api/auth/profile", token, update, UserResponse.class);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody().getName()).isEqualTo("Renamed Customer");
        assertThat(updated.getBody().getEmail()).isEqualTo(update.getEmail());

        ResponseEntity<UserResponse> reread = get("/api/auth/profile", token, UserResponse.class);
        assertThat(reread.getBody().getEmail()).isEqualTo(update.getEmail());
    }

    @Test
    void profileEmailChangeToDuplicateIsRejected() {
        String own = customerEmail();
        registerCustomer(own);
        String ownToken = loginAndToken(own, "password123");

        String other = customerEmail();
        registerCustomer(other);

        ProfileRequest clash = new ProfileRequest();
        clash.setName("Clashing");
        clash.setEmail(other);

        ResponseEntity<Map> response = put("/api/auth/profile", ownToken, clash, Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void profileEndpointsRequireAuthentication() {
        ResponseEntity<Map> anonymous = get("/api/auth/profile", null, Map.class);
        assertThat(anonymous.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<Map> garbageToken = get("/api/auth/profile", "not-a-jwt", Map.class);
        assertThat(garbageToken.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private RegisterRequest registerBody(String email) {
        RegisterRequest request = new RegisterRequest();
        request.setName("Flow Customer");
        request.setEmail(email);
        request.setPassword("password123");
        return request;
    }

    private ResponseEntity<LoginResponse> login(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return rest.postForEntity("/api/auth/login", new HttpEntity<>(request), LoginResponse.class);
    }

    private ResponseEntity<Map> loginRaw(String email, String password) {
        return rest.postForEntity("/api/auth/login", new HttpEntity<>(Map.of("email", email, "password", password)),
                Map.class);
    }
}