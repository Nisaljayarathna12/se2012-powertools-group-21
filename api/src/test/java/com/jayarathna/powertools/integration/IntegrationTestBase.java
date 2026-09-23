package com.jayarathna.powertools.integration;

import com.jayarathna.powertools.config.ItTestcontainerMySql;
import com.jayarathna.powertools.dto.LoginRequest;
import com.jayarathna.powertools.dto.LoginResponse;
import com.jayarathna.powertools.dto.RegisterRequest;
import com.jayarathna.powertools.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Base class for all JUnit {@code integration}-tagged tests that need the full
 * Spring context plus a real MySQL database.
 *
 * <p>Each test starts from a clean slate: all transactional rows are wiped and
 * non-admin users removed, while the Flyway-migrated schema, the seeded
 * categories and the seeded admin user are preserved.</p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles(resolver = ItProfiles.class)
@Import(ItTestcontainerMySql.class)
@AutoConfigureTestRestTemplate
@Tag("integration")
public abstract class IntegrationTestBase {

    public static final String ADMIN_EMAIL = "admin@powertools.com";
    public static final String ADMIN_PASSWORD = "Admin@1234";

    private static final List<String> TRUNCATE_TABLES = List.of(
            "CART_ITEM",
            "ORDER_ITEM",
            "ORDER_STATUS_HISTORY",
            "PAYMENT",
            "CART",
            "ORDER_ENTITY",
            "PRODUCT",
            "category"
    );

    private static final String SEED_CATEGORIES_SQL = """
            INSERT INTO `category` (category_id, category_name, category_description) VALUES
                ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Power Drills', 'Corded and cordless drills for drilling holes and driving screws'),
                ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Angle Grinders', 'Angle grinders for cutting, grinding, and polishing'),
                ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Circular Saws', 'Handheld circular saws for cutting wood, metal, and masonry'),
                ('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Impact Wrenches', 'Pneumatic and electric impact wrenches for heavy-duty fastening'),
                ('a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Sanders', 'Belt sanders, orbital sanders, and disc sanders for surface finishing'),
                ('a1b2c3d4-e5f6-7890-abcd-ef1234567806', 'Jigsaws', 'Jigsaws for intricate curved and straight cuts'),
                ('a1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Rotary Hammers', 'Rotary hammer drills for concrete and masonry drilling'),
                ('a1b2c3d4-e5f6-7890-abcd-ef1234567808', 'Planers', 'Electric planers for shaping and smoothing wood surfaces'),
                ('a1b2c3d4-e5f6-7890-abcd-ef1234567809', 'Heat Guns', 'Industrial heat guns for paint stripping, shrinking, and thawing'),
                ('a1b2c3d4-e5f6-7890-abcd-ef123456780a', 'Air Compressors', 'Portable and stationary compressors for powering pneumatic tools');
            """;

    @Autowired
    protected TestRestTemplate rest;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void resetDatabase() {
        jdbc.execute("SET FOREIGN_KEY_CHECKS=0");
        for (String table : TRUNCATE_TABLES) {
            jdbc.execute("TRUNCATE TABLE `" + table + "`");
        }
        jdbc.update("DELETE FROM `USER` WHERE role <> 'ADMIN'");
        jdbc.execute(SEED_CATEGORIES_SQL);
        jdbc.execute("SET FOREIGN_KEY_CHECKS=1");
    }

    protected String customerEmail() {
        return "customer." + System.nanoTime() + "@example.com";
    }

    protected UserResponse registerCustomer(String email) {
        RegisterRequest request = new RegisterRequest();
        request.setName("Integration Customer");
        request.setEmail(email);
        request.setPassword("password123");
        ResponseEntity<UserResponse> response =
                rest.postForEntity("/api/auth/register", new HttpEntity<>(request), UserResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        return response.getBody();
    }

    protected String loginAndToken(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        ResponseEntity<LoginResponse> response =
                rest.postForEntity("/api/auth/login", new HttpEntity<>(request), LoginResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();
        return response.getBody().getToken();
    }

    protected HttpHeaders bearerHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }

    protected HttpHeaders adminHeaders() {
        return bearerHeaders(adminToken());
    }

    protected String adminToken() {
        return loginAndToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    protected <T> ResponseEntity<T> get(String url, String token, Class<T> type) {
        return rest.exchange(url, HttpMethod.GET, new HttpEntity<>(bearerHeaders(token)), type);
    }

    protected <T> ResponseEntity<T> post(String url, String token, Object body, Class<T> type) {
        return rest.exchange(url, HttpMethod.POST, new HttpEntity<>(body, bearerHeaders(token)), type);
    }

    protected <T> ResponseEntity<T> put(String url, String token, Object body, Class<T> type) {
        return rest.exchange(url, HttpMethod.PUT, new HttpEntity<>(body, bearerHeaders(token)), type);
    }

    protected ResponseEntity<Void> delete(String url, String token) {
        return rest.exchange(url, HttpMethod.DELETE, new HttpEntity<>(bearerHeaders(token)), Void.class);
    }
}