package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.AdminDashboard;
import com.jayarathna.powertools.feature.product.Category;
import com.jayarathna.powertools.model.Order;
import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.OrderRepository;
import com.jayarathna.powertools.repository.ProductRepository;
import com.jayarathna.powertools.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    private AdminDashboardService adminDashboardService;

    @BeforeEach
    void setUp() {
        adminDashboardService = new AdminDashboardService(productRepository, orderRepository, userRepository, 0);
    }

    private static User admin() {
        User admin = new User("Admin", "admin@powertools.com", "pw", "ADMIN");
        admin.setUserId(2);
        return admin;
    }

    private static Product product() {
        Category category = new Category();
        category.setCategoryId(java.util.UUID.randomUUID());
        Product product = new Product(category, "Drill", BigDecimal.valueOf(25), 3, "img.png");
        product.setProductId(7);
        product.setActive(true);
        return product;
    }

    private static Order order() {
        Order order = new Order(admin(), LocalDate.of(2026, 1, 1), BigDecimal.valueOf(50), "PENDING", "1 Main St");
        order.setOrderId(5);
        return order;
    }

    @Test
    void buildAggregatesDashboardMetrics() {
        when(orderRepository.findTop10ByOrderByOrderIdDesc()).thenReturn(List.of(order()));
        when(productRepository.findTop5ByStockQtyLessThanEqualAndActiveTrueOrderByStockQtyAsc(0))
                .thenReturn(List.of(product()));
        when(productRepository.countByActiveTrue()).thenReturn(3L);
        when(orderRepository.count()).thenReturn(7L);
        when(userRepository.countByRole("CUSTOMER")).thenReturn(2L);
        when(productRepository.countByStockQtyLessThanEqualAndActiveTrue(0)).thenReturn(1L);

        AdminDashboard dashboard = adminDashboardService.build(admin());

        assertEquals("admin@powertools.com", dashboard.user().getEmail());
        assertEquals(3L, dashboard.products());
        assertEquals(7L, dashboard.orders());
        assertEquals(2L, dashboard.customers());
        assertEquals(1L, dashboard.lowStockCount());
        assertEquals(1, dashboard.recentOrders().size());
        assertEquals(1, dashboard.lowStockProducts().size());
        assertEquals("Drill", dashboard.lowStockProducts().get(0).getName());
        assertTrue(dashboard.recentOrders().get(0).totalAmount()
                .compareTo(BigDecimal.valueOf(50)) == 0);
    }
}