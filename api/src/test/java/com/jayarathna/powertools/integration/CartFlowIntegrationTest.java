package com.jayarathna.powertools.integration;

import com.jayarathna.powertools.dto.AddCartItemRequest;
import com.jayarathna.powertools.dto.CartCountResponse;
import com.jayarathna.powertools.dto.CartItemResponse;
import com.jayarathna.powertools.dto.CartResponse;
import com.jayarathna.powertools.dto.CreateProductRequest;
import com.jayarathna.powertools.dto.ProductDto;
import com.jayarathna.powertools.dto.UpdateCartItemRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Customer cart lifecycle over HTTP: lazy cart creation, item add/merge/update/
 * remove, totals, counts, and stock/ownership enforcement.
 */
class CartFlowIntegrationTest extends IntegrationTestBase {

    private static final UUID POWER_DRILLS = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567801");

    @Test
    void emptyCartIsCreatedWithZeroTotals() {
        String token = customerToken();

        ResponseEntity<CartResponse> cart = get("/api/cart", token, CartResponse.class);
        assertThat(cart.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cart.getBody().cartId()).isNotNull();
        assertThat(cart.getBody().items()).isEmpty();
        assertThat(cart.getBody().itemCount()).isZero();
        assertThat(cart.getBody().totalQuantity()).isZero();
        assertThat(cart.getBody().totalAmount()).isEqualTo(BigDecimal.ZERO);
    }

    @Test
    void countStartsAtZeroAndTracksItems() {
        String token = customerToken();

        CartCountResponse initial = get("/api/cart/count", token, CartCountResponse.class).getBody();
        assertThat(initial.itemCount()).isZero();
        assertThat(initial.totalQuantity()).isZero();

        int drill = createProduct("Count Drill", "40.00", 50);
        addItem(token, drill, 2);
        addItem(token, drill, 1);

        CartCountResponse after = get("/api/cart/count", token, CartCountResponse.class).getBody();
        assertThat(after.itemCount()).isEqualTo(1);
        assertThat(after.totalQuantity()).isEqualTo(3);
    }

    @Test
    void addItemReturnsUpdatedCartTotals() {
        String token = customerToken();
        int drill = createProduct("Total Drill", "199.99", 100);

        CartResponse cart = addItem(token, drill, 2);
        assertThat(cart.itemCount()).isEqualTo(1);
        assertThat(cart.totalQuantity()).isEqualTo(2);
        assertThat(cart.totalAmount()).isEqualByComparingTo("399.98");

        CartItemResponse item = cart.items().get(0);
        assertThat(item.productId()).isEqualTo(drill);
        assertThat(item.quantity()).isEqualTo(2);
        assertThat(item.lineTotal()).isEqualByComparingTo("399.98");
    }

    @Test
    void addingSameProductAgainMergesQuantity() {
        String token = customerToken();
        int drill = createProduct("Merge Drill", "10.00", 100);

        addItem(token, drill, 2);
        CartResponse after = addItem(token, drill, 3);

        assertThat(after.itemCount()).isEqualTo(1);
        assertThat(after.totalQuantity()).isEqualTo(5);
        assertThat(after.totalAmount()).isEqualByComparingTo("50.00");
    }

    @Test
    void addingDifferentProductsAccumulates() {
        String token = customerToken();
        int drill = createProduct("Acc Drill", "100.00", 20);
        int grinder = createProduct("Acc Grinder", "50.00", 20);

        addItem(token, drill, 1);
        CartResponse after = addItem(token, grinder, 3);

        assertThat(after.itemCount()).isEqualTo(2);
        assertThat(after.totalQuantity()).isEqualTo(4);
        assertThat(after.totalAmount()).isEqualByComparingTo("250.00");
    }

    @Test
    void addItemValidationsAreEnforced() {
        String token = customerToken();
        int drill = createProduct("Valid Drill", "10.00", 5);

        ResponseEntity<Map> zeroQty = post("/api/cart/items", token,
                new AddCartItemRequest(drill, 0), Map.class);
        assertThat(zeroQty.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> missing = post("/api/cart/items", token,
                new AddCartItemRequest(999999, 1), Map.class);
        assertThat(missing.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<Map> tooMany = post("/api/cart/items", token,
                new AddCartItemRequest(drill, 6), Map.class);
        assertThat(tooMany.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        addItem(token, drill, 5);
        ResponseEntity<Map> overTotal = post("/api/cart/items", token,
                new AddCartItemRequest(drill, 1), Map.class);
        assertThat(overTotal.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateItemQuantityRoundTrip() {
        String token = customerToken();
        int drill = createProduct("Update Drill", "20.00", 10);
        int cartItemId = addItem(token, drill, 2).items().get(0).cartItemId();

        CartResponse updated = put("/api/cart/items/" + cartItemId, token,
                new UpdateCartItemRequest(7), CartResponse.class).getBody();
        assertThat(updated.totalQuantity()).isEqualTo(7);
        assertThat(updated.totalAmount()).isEqualByComparingTo("140.00");

        ResponseEntity<Map> overStock = put("/api/cart/items/" + cartItemId, token,
                new UpdateCartItemRequest(11), Map.class);
        assertThat(overStock.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> zero = put("/api/cart/items/" + cartItemId, token,
                new UpdateCartItemRequest(0), Map.class);
        assertThat(zero.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void removeItemEmptyTheCart() {
        String token = customerToken();
        int drill = createProduct("Remove Drill", "10.00", 10);
        int cartItemId = addItem(token, drill, 4).items().get(0).cartItemId();

        ResponseEntity<CartResponse> removal =
                rest.exchange("/api/cart/items/" + cartItemId,
                        org.springframework.http.HttpMethod.DELETE,
                        new org.springframework.http.HttpEntity<>(bearerHeaders(token)),
                        CartResponse.class);
        assertThat(removal.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(removal.getBody().items()).isEmpty();
        assertThat(removal.getBody().itemCount()).isZero();
        assertThat(removal.getBody().totalAmount()).isEqualTo(BigDecimal.ZERO);
    }

    @Test
    void cartPersistsAcrossRequests() {
        String token = customerToken();
        int drill = createProduct("Sticky Drill", "10.00", 10);

        CartResponse first = get("/api/cart", token, CartResponse.class).getBody();
        addItem(token, drill, 1);
        CartResponse second = get("/api/cart", token, CartResponse.class).getBody();

        assertThat(second.cartId()).isEqualTo(first.cartId());
        assertThat(second.itemCount()).isEqualTo(1);
    }

    @Test
    void customerCannotTouchAnotherCustomersCartItem() {
        String tokenA = customerToken();
        int drill = createProduct("Isolation Drill", "10.00", 10);
        int cartItemId = addItem(tokenA, drill, 1).items().get(0).cartItemId();

        String tokenB = customerToken();
        ResponseEntity<Map> denied =
                put("/api/cart/items/" + cartItemId, tokenB, new UpdateCartItemRequest(5), Map.class);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(delete("/api/cart/items/" + cartItemId, tokenB).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void cartEndpointsRequireAuthentication() {
        assertThat(get("/api/cart", null, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(get("/api/cart/count", null, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(post("/api/cart/items", null, new AddCartItemRequest(1, 1), Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private int createProduct(String name, String price, int stock) {
        CreateProductRequest request = new CreateProductRequest(
                POWER_DRILLS, name, new BigDecimal(price), stock, null, "cart it product");
        ResponseEntity<ProductDto> response =
                post("/api/admin/products", adminToken(), request, ProductDto.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody().getProductId();
    }

    private CartResponse addItem(String token, int productId, int quantity) {
        ResponseEntity<CartResponse> response = post("/api/cart/items", token,
                new AddCartItemRequest(productId, quantity), CartResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
    }

    private String customerToken() {
        String email = customerEmail();
        registerCustomer(email);
        return loginAndToken(email, "password123");
    }
}