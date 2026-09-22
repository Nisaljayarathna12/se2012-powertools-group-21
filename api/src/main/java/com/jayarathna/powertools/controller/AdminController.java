package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.dto.AdminDashboard;
import com.jayarathna.powertools.dto.AdminSummary;
import com.jayarathna.powertools.dto.CreateProductRequest;
import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.dto.ProductDto;
import com.jayarathna.powertools.dto.UpdateOrderStatusRequest;
import com.jayarathna.powertools.dto.UpdateStockRequest;
import com.jayarathna.powertools.dto.UserResponse;
import com.jayarathna.powertools.feature.product.CategoryRepository;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.ProductRepository;
import com.jayarathna.powertools.service.AdminDashboardService;
import com.jayarathna.powertools.service.AuthService;
import com.jayarathna.powertools.service.OrderService;
import com.jayarathna.powertools.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final AdminDashboardService adminDashboardService;
    private final ProductService productService;
    private final OrderService orderService;

    public AdminController(AuthService authService,
                           ProductRepository productRepository,
                           CategoryRepository categoryRepository,
                           AdminDashboardService adminDashboardService,
                           ProductService productService,
                           OrderService orderService) {
        this.authService = authService;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.adminDashboardService = adminDashboardService;
        this.productService = productService;
        this.orderService = orderService;
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminSummary> summary(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        User admin = authService.currentUser(authorization);
        return ResponseEntity.ok(new AdminSummary(
                new UserResponse(admin),
                productRepository.countByActiveTrue(),
                categoryRepository.count()
        ));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboard> dashboard(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        User admin = authService.currentUser(authorization);
        return ResponseEntity.ok(adminDashboardService.build(admin));
    }

    @GetMapping("/orders")
    public ResponseEntity<Page<OrderResponse>> orders(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "date") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        authService.currentUser(authorization);
        return ResponseEntity.ok(orderService.getOrders(status, from, to, sort, direction, page, size));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable int id,
            @Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @PutMapping("/products/{id}/stock")
    public ResponseEntity<ProductDto> updateStock(
            @PathVariable int id,
            @Valid @RequestBody UpdateStockRequest request) {
        return ResponseEntity.ok(productService.adjustStock(id, request.adjustment()));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable int id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable int id,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        User admin = authService.currentUser(authorization);
        return ResponseEntity.ok(orderService.updateStatus(id, request.status(), admin));
    }
}