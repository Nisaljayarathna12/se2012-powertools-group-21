package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.dto.AdminDashboard;
import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.dto.UserResponse;
import com.jayarathna.powertools.feature.product.CategoryRepository;
import com.jayarathna.powertools.model.Order;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.ProductRepository;
import com.jayarathna.powertools.repository.UserRepository;
import com.jayarathna.powertools.service.AdminDashboardService;
import com.jayarathna.powertools.service.AuthService;
import com.jayarathna.powertools.service.JwtService;
import com.jayarathna.powertools.service.OrderService;
import com.jayarathna.powertools.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Validates the admin contract shared with the frontend
 * ({@code web/lib/api.ts}: User, OrderResponse, AdminOrdersResponse, AdminDashboard).
 */
@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private ProductRepository productRepository;

    @MockitoBean
    private CategoryRepository categoryRepository;

    @MockitoBean
    private AdminDashboardService adminDashboardService;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private OrderService orderService;

    private static User admin() {
        User user = new User("Site Administrator", "admin@powertools.com", "pw", "ADMIN");
        user.setUserId(1);
        return user;
    }

    private static Order order() {
        User customer = new User("Alice Customer", "alice@example.com", "pw", "CUSTOMER");
        customer.setUserId(8);
        Order order = new Order(customer, LocalDate.now(), BigDecimal.valueOf(74.50), "PENDING", "1 Main St");
        order.setOrderId(3);
        return order;
    }

    @Test
    void adminOrdersUsesStableEnvelopeWithoutPageImplInternals() throws Exception {
        when(authService.currentUser(any())).thenReturn(admin());
        when(orderService.getOrders(any(), any(), any(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(
                        List.of(new OrderResponse(order())),
                        PageRequest.of(0, 10),
                        1));

        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].orderId").value(3))
                .andExpect(jsonPath("$.content[0].customerName").value("Alice Customer"))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(true))
                .andExpect(jsonPath("$.number").doesNotExist())
                .andExpect(jsonPath("$.pageable").doesNotExist());
    }

    @Test
    void adminDashboardMatchesFrontendAdminDashboardShape() throws Exception {
        when(authService.currentUser(any())).thenReturn(admin());
        when(adminDashboardService.build(any())).thenReturn(new AdminDashboard(
                new UserResponse(admin()),
                6,
                3,
                9,
                0,
                List.of(new OrderResponse(order())),
                List.of()
        ));

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("admin@powertools.com"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.products").value(6))
                .andExpect(jsonPath("$.orders").value(3))
                .andExpect(jsonPath("$.customers").value(9))
                .andExpect(jsonPath("$.lowStockCount").value(0))
                .andExpect(jsonPath("$.recentOrders[0].orderId").value(3))
                .andExpect(jsonPath("$.lowStockProducts").isArray());
    }

    @Test
    void adminSummaryMatchesFrontendShape() throws Exception {
        when(authService.currentUser(any())).thenReturn(admin());
        when(productRepository.countByActiveTrue()).thenReturn(6L);
        when(categoryRepository.count()).thenReturn(10L);

        mockMvc.perform(get("/api/admin/summary")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.products").value(6))
                .andExpect(jsonPath("$.categories").value(10));
    }
}