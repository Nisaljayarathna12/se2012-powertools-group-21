package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.AdminDashboard;
import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.dto.ProductDto;
import com.jayarathna.powertools.dto.UserResponse;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.OrderRepository;
import com.jayarathna.powertools.repository.ProductRepository;
import com.jayarathna.powertools.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminDashboardService {

    private static final String ROLE_CUSTOMER = "CUSTOMER";

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final int lowStockThreshold;

    public AdminDashboardService(ProductRepository productRepository,
                                 OrderRepository orderRepository,
                                 UserRepository userRepository,
                                 @Value("${app.admin.low-stock-threshold:5}") int lowStockThreshold) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.lowStockThreshold = lowStockThreshold;
    }

    @Transactional(readOnly = true)
    public AdminDashboard build(User admin) {
        List<OrderResponse> recentOrders = orderRepository.findTop10ByOrderByOrderIdDesc()
                .stream()
                .map(OrderResponse::new)
                .toList();

        List<ProductDto> lowStockProducts = productRepository
                .findTop5ByStockQtyLessThanEqualAndActiveTrueOrderByStockQtyAsc(lowStockThreshold)
                .stream()
                .map(ProductDto::new)
                .toList();

        return new AdminDashboard(
                new UserResponse(admin),
                productRepository.countByActiveTrue(),
                orderRepository.count(),
                userRepository.countByRole(ROLE_CUSTOMER),
                productRepository.countByStockQtyLessThanEqualAndActiveTrue(lowStockThreshold),
                recentOrders,
                lowStockProducts
        );
    }
}