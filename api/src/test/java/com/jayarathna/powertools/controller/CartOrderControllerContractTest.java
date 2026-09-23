package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.dto.CartCountResponse;
import com.jayarathna.powertools.dto.CartResponse;
import com.jayarathna.powertools.dto.OrderDetailResponse;
import com.jayarathna.powertools.dto.OrderItemResponse;
import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.UserRepository;
import com.jayarathna.powertools.service.AuthService;
import com.jayarathna.powertools.service.CartService;
import com.jayarathna.powertools.service.JwtService;
import com.jayarathna.powertools.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Validates the cart/orders/customer/health endpoints against the
 * request/response contract shared with the frontend ({@code web/lib/api.ts}).
 */
@WebMvcTest(controllers = {CartController.class, OrderController.class,
        CustomerOrderController.class, HealthController.class})
@AutoConfigureMockMvc(addFilters = false)
class CartOrderControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CartService cartService;

    @MockitoBean
    private OrderService orderService;

    private static User customer() {
        User user = new User("Alice", "alice@example.com", "pw", "CUSTOMER");
        user.setUserId(1);
        return user;
    }

    @Test
    void getCartReturnsCartEnvelope() throws Exception {
        when(authService.currentUser(anyString())).thenReturn(customer());
        when(cartService.getCart(any(User.class)))
                .thenReturn(new CartResponse(10, List.of(), 0, 0, BigDecimal.ZERO));

        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cartId").value(10))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.itemCount").value(0))
                .andExpect(jsonPath("$.totalQuantity").value(0))
                .andExpect(jsonPath("$.totalAmount").value(0));
    }

    @Test
    void getCartCountReturnsCountEnvelope() throws Exception {
        when(authService.currentUser(anyString())).thenReturn(customer());
        when(cartService.getCount(any(User.class))).thenReturn(new CartCountResponse(2, 5));

        mockMvc.perform(get("/api/cart/count")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(2))
                .andExpect(jsonPath("$.totalQuantity").value(5));
    }

    @Test
    void addCartItemReturnsCartEnvelope() throws Exception {
        when(authService.currentUser(anyString())).thenReturn(customer());
        when(cartService.addItem(any(User.class), anyInt(), anyInt()))
                .thenReturn(new CartResponse(10, List.of(), 1, 2, BigDecimal.valueOf(99)));

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":7,\"quantity\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cartId").value(10))
                .andExpect(jsonPath("$.itemCount").value(1))
                .andExpect(jsonPath("$.totalQuantity").value(2));
    }

    @Test
    void updateCartItemReturnsCartEnvelope() throws Exception {
        when(authService.currentUser(anyString())).thenReturn(customer());
        when(cartService.updateItemQuantity(any(User.class), anyInt(), anyInt()))
                .thenReturn(new CartResponse(10, List.of(), 1, 5, BigDecimal.valueOf(247)));

        mockMvc.perform(put("/api/cart/items/3")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalQuantity").value(5));
    }

    @Test
    void removeCartItemReturnsCartEnvelope() throws Exception {
        when(authService.currentUser(anyString())).thenReturn(customer());
        when(cartService.removeItem(any(User.class), anyInt()))
                .thenReturn(new CartResponse(10, List.of(), 0, 0, BigDecimal.ZERO));

        mockMvc.perform(delete("/api/cart/items/3")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(0));
    }

    @Test
    void createOrderReturnsOrderDetailEnvelope() throws Exception {
        when(authService.currentUser(anyString())).thenReturn(customer());
        when(orderService.createOrder(any(User.class), any()))
                .thenReturn(new OrderDetailResponse(
                        5, java.time.LocalDate.of(2026, 1, 1), BigDecimal.valueOf(50),
                        "PENDING", "1 Main St, Springfield, 62704", "Alice",
                        List.of(new OrderItemResponse(44, 7, "Drill", 2,
                                BigDecimal.valueOf(25), "img.png", BigDecimal.valueOf(50)))));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"street\":\"1 Main St\",\"city\":\"Springfield\",\"postalCode\":\"62704\",\"phone\":\"5550100\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(5))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.customerName").value("Alice"))
                .andExpect(jsonPath("$.items[0].productId").value(7))
                .andExpect(jsonPath("$.items[0].lineTotal").value(50));
    }

    @Test
    void getMyOrdersReturnsOrderResponseList() throws Exception {
        when(authService.currentUser(anyString())).thenReturn(customer());
        when(orderService.getCustomerOrders(1))
                .thenReturn(List.of(new OrderResponse(
                        5, java.time.LocalDate.of(2026, 1, 1), BigDecimal.valueOf(50),
                        "PENDING", "1 Main St", "Alice")));

        mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderId").value(5))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].customerName").value("Alice"));
    }

    @Test
    void customerOrdersEndpointReturnsList() throws Exception {
        when(authService.currentUser(anyString())).thenReturn(customer());
        when(orderService.getCustomerOrders(1))
                .thenReturn(List.of(new OrderResponse(
                        5, java.time.LocalDate.of(2026, 1, 1), BigDecimal.valueOf(50),
                        "PENDING", "1 Main St", "Alice")));

        mockMvc.perform(get("/api/customer/orders")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].shippingAddress").value("1 Main St"));
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp").exists());
    }
}