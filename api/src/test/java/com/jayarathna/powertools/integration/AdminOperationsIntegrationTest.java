package com.jayarathna.powertools.integration;

import com.jayarathna.powertools.dto.AdminDashboard;
import com.jayarathna.powertools.dto.AdminOrdersResponse;
import com.jayarathna.powertools.dto.AdminSummary;
import com.jayarathna.powertools.dto.AddCartItemRequest;
import com.jayarathna.powertools.dto.CreateOrderRequest;
import com.jayarathna.powertools.dto.CreateProductRequest;
import com.jayarathna.powertools.dto.LoginResponse;
import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.dto.ProductDto;
import com.jayarathna.powertools.dto.UpdateOrderStatusRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Admin operations: role enforcement, summary/dashboard metrics, the stable
 * admin orders envelope, and the order-status update audit flow.
 */
class AdminOperationsIntegrationTest extends IntegrationTestBase {

    private static final UUID POWER_DRILLS = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567801");

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void seededAdminCanSignIn() {
        ResponseEntity<LoginResponse> login =
                rest.postForEntity("/api/auth/login",
                        new org.springframework.http.HttpEntity<>(Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD)),
                        LoginResponse.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(login.getBody().getRole()).isEqualTo("ADMIN");
        assertThat(login.getBody().getToken()).isNotBlank();
    }

    @Test
    void customerCannotAccessAdminArea() {
        String customer = customerSession();
        for (String path : new String[]{"/api/admin/summary", "/api/admin/dashboard", "/api/admin/orders"}) {
            assertThat(get(path, customer, Map.class).getStatusCode())
                    .isEqualTo(HttpStatus.FORBIDDEN);
        }
        assertThat(post("/api/admin/products", customer,
                productRequest("Nope", "1.00", 1), Map.class).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void adminAreaRequiresAuthentication() {
        assertThat(get("/api/admin/summary", null, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(get("/api/admin/orders", null, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(post("/api/admin/products", null, productRequest("X", "1.00", 1), Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void summaryReportsCountsAndAdminIdentity() {
        createProduct("Summary Drill", "10.00", 2);

        ResponseEntity<AdminSummary> response = get("/api/admin/summary", adminToken(), AdminSummary.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().products()).isEqualTo(1);
        assertThat(response.getBody().categories()).isEqualTo(10);
        assertThat(response.getBody().user().getEmail()).isEqualTo(ADMIN_EMAIL);
        assertThat(response.getBody().user().getRole()).isEqualTo("ADMIN");
    }

    @Test
    void dashboardReportsMetrics() {
        String customer = customerSession();
        int drill = createProduct("Dashboard Drill", "30.00", 10);
        addToCart(customer, drill, 1);
        int orderId = post("/api/orders", customer, orderRequest(), com.jayarathna.powertools.dto.OrderDetailResponse.class)
                .getBody().orderId();

        ResponseEntity<AdminDashboard> response = get("/api/admin/dashboard", adminToken(), AdminDashboard.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().user().getEmail()).isEqualTo(ADMIN_EMAIL);
        assertThat(response.getBody().products()).isEqualTo(1);
        assertThat(response.getBody().orders()).isEqualTo(1);
        assertThat(response.getBody().customers()).isEqualTo(1);
        assertThat(response.getBody().lowStockCount()).isZero();
        assertThat(response.getBody().recentOrders())
                .extracting(OrderResponse::orderId)
                .contains(orderId);
    }

    @Test
    void adminOrdersEnvelopeIsStableAndBackgroundIsEmpty() {
        ResponseEntity<AdminOrdersResponse> empty = get("/api/admin/orders", adminToken(), AdminOrdersResponse.class);
        assertThat(empty.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(empty.getBody().content()).isEmpty();
        assertThat(empty.getBody().page()).isZero();
        assertThat(empty.getBody().size()).isEqualTo(10);
        assertThat(empty.getBody().totalElements()).isZero();
        assertThat(empty.getBody().totalPages()).isZero();
        assertThat(empty.getBody().first()).isTrue();
        assertThat(empty.getBody().last()).isTrue();

        String customer = customerSession();
        int drill = createProduct("Ordered Drill", "10.00", 5);
        addToCart(customer, drill, 2);
        int orderId = post("/api/orders", customer, orderRequest(), com.jayarathna.powertools.dto.OrderDetailResponse.class)
                .getBody().orderId();

        AdminOrdersResponse populated = get("/api/admin/orders", adminToken(), AdminOrdersResponse.class).getBody();
        assertThat(populated.totalElements()).isEqualTo(1);
        assertThat(populated.content()).hasSize(1);
        assertThat(populated.content().get(0).orderId()).isEqualTo(orderId);
        assertThat(populated.content().get(0).customerName()).isNotBlank();
    }

    @Test
    void adminUpdatesOrderStatusAndAuditsChange() {
        String customer = customerSession();
        int drill = createProduct("Audit Drill", "10.00", 5);
        addToCart(customer, drill, 1);
        int orderId = post("/api/orders", customer, orderRequest(), com.jayarathna.powertools.dto.OrderDetailResponse.class)
                .getBody().orderId();

        ResponseEntity<OrderResponse> shipped =
                put("/api/admin/orders/" + orderId + "/status", adminToken(),
                        new UpdateOrderStatusRequest("SHIPPED"), OrderResponse.class);
        assertThat(shipped.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(shipped.getBody().status()).isEqualTo("SHIPPED");

        ResponseEntity<OrderResponse> sameAgain =
                put("/api/admin/orders/" + orderId + "/status", adminToken(),
                        new UpdateOrderStatusRequest("shipped"), OrderResponse.class);
        assertThat(sameAgain.getStatusCode()).isEqualTo(HttpStatus.OK);

        assertThat(historyCount(orderId)).isEqualTo(1);

        com.jayarathna.powertools.dto.OrderDetailResponse customerView =
                get("/api/orders/" + orderId, customer, com.jayarathna.powertools.dto.OrderDetailResponse.class).getBody();
        assertThat(customerView.status()).isEqualTo("SHIPPED");
    }

    @Test
    void invalidOrderStatusIsRejected() {
        String customer = customerSession();
        int drill = createProduct("Status Drill", "10.00", 5);
        addToCart(customer, drill, 1);
        int orderId = post("/api/orders", customer, orderRequest(), com.jayarathna.powertools.dto.OrderDetailResponse.class)
                .getBody().orderId();

        ResponseEntity<Map> bogus = put("/api/admin/orders/" + orderId + "/status", adminToken(),
                new UpdateOrderStatusRequest("BOUNCED"), Map.class);
        assertThat(bogus.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> unknownOrder = put("/api/admin/orders/999999/status", adminToken(),
                new UpdateOrderStatusRequest("SHIPPED"), Map.class);
        assertThat(unknownOrder.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private int historyCount(int orderId) {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM ORDER_STATUS_HISTORY WHERE order_id = ?", Integer.class, orderId);
    }

    private String customerSession() {
        String email = customerEmail();
        registerCustomer(email);
        return loginAndToken(email, "password123");
    }

    private int createProduct(String name, String price, int stock) {
        CreateProductRequest request = new CreateProductRequest(
                POWER_DRILLS, name, new BigDecimal(price), stock, null, "admin it product");
        ResponseEntity<ProductDto> response =
                post("/api/admin/products", adminToken(), request, ProductDto.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody().getProductId();
    }

    private void addToCart(String token, int productId, int quantity) {
        ResponseEntity<com.jayarathna.powertools.dto.CartResponse> response = post("/api/cart/items", token,
                new AddCartItemRequest(productId, quantity),
                com.jayarathna.powertools.dto.CartResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    private CreateOrderRequest orderRequest() {
        return new CreateOrderRequest("Main Street", "Colombo", "00100", "0770 123 456");
    }

    private Map<String, Object> productRequest(String name, String price, int stock) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("categoryId", POWER_DRILLS.toString());
        request.put("name", name);
        request.put("price", new BigDecimal(price));
        request.put("stockQty", stock);
        request.put("imageUrl", null);
        request.put("description", "admin it product");
        return request;
    }
}