package com.jayarathna.powertools.integration;

import com.jayarathna.powertools.dto.AddCartItemRequest;
import com.jayarathna.powertools.dto.CartResponse;
import com.jayarathna.powertools.dto.CreateOrderRequest;
import com.jayarathna.powertools.dto.CreateProductRequest;
import com.jayarathna.powertools.dto.OrderDetailResponse;
import com.jayarathna.powertools.dto.OrderItemResponse;
import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.dto.ProductDto;
import com.jayarathna.powertools.dto.UpdateStockRequest;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Order placement flow: placing an order from cart, order retrieval through the
 * customer endpoints, and the stock/ownership/validation rules that guard it.
 */
class OrderFlowIntegrationTest extends IntegrationTestBase {

    private static final UUID POWER_DRILLS = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567801");

    @Test
    void placeOrderFromCartReturnsDetailAndClearsCart() {
        String customer = customerSession();
        int drill = createProduct("Order Drill", "89.00", 10);
        addToCart(customer, drill, 2);

        ResponseEntity<OrderDetailResponse> created =
                post("/api/orders", customer, orderRequest(), OrderDetailResponse.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        OrderDetailResponse order = created.getBody();
        assertThat(order.orderId()).isNotNull();
        assertThat(order.status()).isEqualTo("PENDING");
        assertThat(order.totalAmount()).isEqualByComparingTo("178.00");
        assertThat(order.shippingAddress())
                .contains("Main Street")
                .contains("Colombo")
                .contains("00100")
                .contains("0770 123 456");

        assertThat(order.items()).hasSize(1);
        OrderItemResponse item = order.items().get(0);
        assertThat(item.quantity()).isEqualTo(2);
        assertThat(item.unitPrice()).isEqualByComparingTo("89.00");
        assertThat(item.lineTotal()).isEqualByComparingTo("178.00");

        CartResponse cartAfter = get("/api/cart", customer, CartResponse.class).getBody();
        assertThat(cartAfter.items()).isEmpty();
        assertThat(cartAfter.itemCount()).isZero();
    }

    @Test
    void placedOrderIsVisibleInCustomerListsAndDetail() {
        String customer = customerSession();
        int drill = createProduct("Visible Drill", "25.00", 5);
        addToCart(customer, drill, 1);
        int orderId = post("/api/orders", customer, orderRequest(), OrderDetailResponse.class)
                .getBody().orderId();

        ResponseEntity<List<OrderResponse>> myOrders = get("/api/orders", customer,
                new ParameterizedTypeReference<List<OrderResponse>>() {
                });
        assertThat(myOrders.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(myOrders.getBody()).hasSize(1);
        assertThat(myOrders.getBody().get(0).orderId()).isEqualTo(orderId);
        assertThat(myOrders.getBody().get(0).status()).isEqualTo("PENDING");

        ResponseEntity<List<OrderResponse>> customerOrders = get("/api/customer/orders", customer,
                new ParameterizedTypeReference<List<OrderResponse>>() {
                });
        assertThat(customerOrders.getBody()).hasSize(1);

        ResponseEntity<OrderDetailResponse> detail =
                get("/api/orders/" + orderId, customer, OrderDetailResponse.class);
        assertThat(detail.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(detail.getBody().orderId()).isEqualTo(orderId);
        assertThat(detail.getBody().items()).hasSize(1);
    }

    @Test
    void emptyCartCannotPlaceOrder() {
        String customer = customerSession();
        ResponseEntity<Map> response = post("/api/orders", customer, orderRequest(), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void orderValidationFailsWhenStockDropsBelowRequestedQuantity() {
        String customer = customerSession();
        int drill = createProduct("Dwindling Drill", "15.00", 3);
        addToCart(customer, drill, 3);

        ResponseEntity<ProductDto> reduce =
                put("/api/admin/products/" + drill + "/stock", adminToken(),
                        new UpdateStockRequest(-2), ProductDto.class);
        assertThat(reduce.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> rejected = post("/api/orders", customer, orderRequest(), Map.class);
        assertThat(rejected.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void customerCannotFetchAnotherCustomersOrder() {
        String customerA = customerSession();
        int drill = createProduct("Isolation Order Drill", "10.00", 5);
        addToCart(customerA, drill, 1);
        int orderId = post("/api/orders", customerA, orderRequest(), OrderDetailResponse.class)
                .getBody().orderId();

        String customerB = customerSession();
        assertThat(get("/api/orders/" + orderId, customerB, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<List<OrderResponse>> listB = get("/api/customer/orders", customerB,
                new ParameterizedTypeReference<List<OrderResponse>>() {
                });
        assertThat(listB.getBody()).isEmpty();
    }

    @Test
    void orderRequestsValidateShippingFields() {
        String customer = customerSession();
        int drill = createProduct("Validation Drill", "10.00", 5);
        addToCart(customer, drill, 1);

        ResponseEntity<Map> blankStreet = post("/api/orders", customer,
                new CreateOrderRequest("", "Colombo", "00100", "0770 123 456"), Map.class);
        assertThat(blankStreet.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void orderEndpointsRequireAuthentication() {
        assertThat(post("/api/orders", null, orderRequest(), Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(get("/api/orders", null, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(get("/api/customer/orders", null, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void unknownOrderIdForOwnCustomerIsNotFound() {
        String customer = customerSession();
        assertThat(get("/api/orders/999999", customer, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    private String customerSession() {
        String email = customerEmail();
        registerCustomer(email);
        return loginAndToken(email, "password123");
    }

    private int createProduct(String name, String price, int stock) {
        CreateProductRequest request = new CreateProductRequest(
                POWER_DRILLS, name, new BigDecimal(price), stock, null, "order it product");
        ResponseEntity<ProductDto> response =
                post("/api/admin/products", adminToken(), request, ProductDto.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody().getProductId();
    }

    private CartResponse addToCart(String token, int productId, int quantity) {
        ResponseEntity<CartResponse> response = post("/api/cart/items", token,
                new AddCartItemRequest(productId, quantity), CartResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
    }

    private CreateOrderRequest orderRequest() {
        return new CreateOrderRequest("Main Street", "Colombo", "00100", "0770 123 456");
    }

    private <T> ResponseEntity<T> get(String url, String token, ParameterizedTypeReference<T> type) {
        return rest.exchange(url, HttpMethod.GET, new org.springframework.http.HttpEntity<>(bearerHeaders(token)), type);
    }
}