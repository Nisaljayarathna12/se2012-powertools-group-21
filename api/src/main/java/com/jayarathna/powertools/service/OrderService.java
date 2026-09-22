package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.CreateOrderRequest;
import com.jayarathna.powertools.dto.OrderDetailResponse;
import com.jayarathna.powertools.dto.OrderItemResponse;
import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.model.Cart;
import com.jayarathna.powertools.model.CartItem;
import com.jayarathna.powertools.model.Order;
import com.jayarathna.powertools.model.OrderItem;
import com.jayarathna.powertools.model.OrderStatus;
import com.jayarathna.powertools.model.OrderStatusHistory;
import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.CartItemRepository;
import com.jayarathna.powertools.repository.CartRepository;
import com.jayarathna.powertools.repository.OrderItemRepository;
import com.jayarathna.powertools.repository.OrderRepository;
import com.jayarathna.powertools.repository.OrderStatusHistoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderStatusHistoryRepository orderStatusHistoryRepository,
                        OrderItemRepository orderItemRepository,
                        CartRepository cartRepository,
                        CartItemRepository cartItemRepository) {
        this.orderRepository = orderRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrders(String status,
                                         LocalDate from,
                                         LocalDate to,
                                         String sort,
                                         String direction,
                                         int page,
                                         int size) {
        Specification<Order> spec = (root, query, cb) -> cb.conjunction();

        if (status != null && !status.isBlank()) {
            String normalized = status.trim();
            spec = spec.and((root, query, cb) ->
                    cb.equal(cb.lower(root.get("status")), normalized.toLowerCase()));
        }

        if (from != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("orderDate"), from));
        }

        if (to != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("orderDate"), to));
        }

        Pageable pageable = PageRequest.of(page, size, buildSort(sort, direction));

        return orderRepository.findAll(spec, pageable).map(OrderResponse::new);
    }

    @Transactional
    public OrderResponse updateStatus(int orderId, String status, User admin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        OrderStatus target;
        try {
            target = OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order status");
        }

        String toStatus = target.name();
        String fromStatus = order.getStatus();

        if (!toStatus.equalsIgnoreCase(fromStatus)) {
            order.setStatus(toStatus);
            orderRepository.save(order);

            orderStatusHistoryRepository.save(new OrderStatusHistory(
                    order,
                    fromStatus,
                    toStatus,
                    LocalDateTime.now(),
                    admin.getUserId()
            ));
        }

        return new OrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getCustomerOrders(Integer userId) {
        return orderRepository.findByUserUserIdOrderByOrderIdDesc(userId)
                .stream()
                .map(OrderResponse::new)
                .toList();
    }

    @Transactional
    public OrderDetailResponse createOrder(User user, CreateOrderRequest request) {
        Cart cart = cartRepository.findByUserUserId(user.getUserId()).orElse(null);

        if (cart == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty");
        }

        List<CartItem> cartItems = cartItemRepository.findByCartCartId(cart.getCartId());
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty");
        }

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            if (!Boolean.TRUE.equals(product.getActive())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "\"" + product.getName() + "\" is no longer available");
            }
            if (product.getStockQty() < cartItem.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Only " + product.getStockQty() + " units of \"" + product.getName() + "\" are available");
            }
        }

        BigDecimal totalAmount = cartItems.stream()
                .map(item -> item.getProduct().getPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = orderRepository.save(new Order(
                user,
                LocalDate.now(),
                totalAmount,
                OrderStatus.PENDING.name(),
                shippingAddress(request)
        ));

        List<OrderItemResponse> items = cartItems.stream()
                .map(cartItem -> orderItemRepository.save(new OrderItem(
                        order,
                        cartItem.getProduct(),
                        cartItem.getQuantity(),
                        cartItem.getProduct().getPrice()
                )))
                .map(OrderItemResponse::new)
                .toList();

        cartItemRepository.deleteAll(cartItems);

        return new OrderDetailResponse(order, items);
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrder(User user, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getUser().getUserId().equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }

        List<OrderItemResponse> items = orderItemRepository.findByOrderOrderId(orderId)
                .stream()
                .map(OrderItemResponse::new)
                .toList();

        return new OrderDetailResponse(order, items);
    }

    private String shippingAddress(CreateOrderRequest request) {
        return request.street().trim() + ", " + request.city().trim()
                + ", " + request.postalCode().trim() + "; Phone: " + request.phone().trim();
    }

    private Sort buildSort(String sort, String direction) {
        String field = switch (sort == null ? "date" : sort) {
            case "total" -> "totalAmount";
            case "status" -> "status";
            default -> "orderDate";
        };

        Sort.Direction dir = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return Sort.by(dir, field);
    }
}