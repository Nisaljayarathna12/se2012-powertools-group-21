package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.CreateOrderRequest;
import com.jayarathna.powertools.dto.OrderDetailResponse;
import com.jayarathna.powertools.dto.OrderResponse;
import com.jayarathna.powertools.model.Cart;
import com.jayarathna.powertools.model.CartItem;
import com.jayarathna.powertools.model.Order;
import com.jayarathna.powertools.model.OrderItem;
import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.CartItemRepository;
import com.jayarathna.powertools.repository.CartRepository;
import com.jayarathna.powertools.repository.OrderItemRepository;
import com.jayarathna.powertools.repository.OrderRepository;
import com.jayarathna.powertools.repository.OrderStatusHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @InjectMocks
    private OrderService orderService;

    private static User user() {
        User user = new User("Alice", "alice@example.com", "pw", "CUSTOMER");
        user.setUserId(1);
        return user;
    }

    private static User admin() {
        User admin = new User("Admin", "admin@powertools.com", "pw", "ADMIN");
        admin.setUserId(2);
        return admin;
    }

    private static Order order(int id, String status) {
        Order order = new Order(user(), LocalDate.of(2026, 1, 1), BigDecimal.valueOf(50), status, "1 Main St");
        order.setOrderId(id);
        return order;
    }

    private static Product product() {
        Product product = new Product(null, "Drill", BigDecimal.valueOf(25), 10, "img.png");
        product.setProductId(7);
        product.setActive(true);
        return product;
    }

    private static Cart cart() {
        Cart cart = new Cart(user(), LocalDate.now());
        cart.setCartId(10);
        return cart;
    }

    private static CartItem cartItem(int quantity) {
        CartItem item = new CartItem(cart(), product(), quantity);
        item.setCartItemId(1);
        return item;
    }

    private static CreateOrderRequest orderRequest() {
        return new CreateOrderRequest("  1 Main St  ", "  Springfield  ", " 62704 ", " +1 555 0100 ");
    }

    @Test
    void getOrdersAppliesStatusFilterAndDefaultsToDateDesc() {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(orderRepository.findAll(any(Specification.class), pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of(order(1, "PENDING"))));

        Page<OrderResponse> result = orderService.getOrders("  PENDING  ", null, null, null, null, 0, 10);

        assertEquals(1, result.getTotalElements());
        assertEquals("PENDING", result.getContent().get(0).status());
        assertEquals(Sort.Direction.DESC, pageableCaptor.getValue().getSort().getOrderFor("orderDate").getDirection());
    }

    @Test
    void getOrdersSupportsTotalSortAscending() {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(orderRepository.findAll(any(Specification.class), pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of()));

        orderService.getOrders(null, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
                "total", "ASC", 0, 10);

        assertEquals(Sort.Direction.ASC,
                pageableCaptor.getValue().getSort().getOrderFor("totalAmount").getDirection());
    }

    @Test
    void getOrdersSupportsStatusSort() {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(orderRepository.findAll(any(Specification.class), pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of()));

        orderService.getOrders(null, null, null, "status", "desc", 0, 10);

        assertEquals("status", pageableCaptor.getValue().getSort().iterator().next().getProperty());
    }

    @Test
    void updateStatusTransitionsAndRecordsHistory() {
        Order order = order(5, "PENDING");
        when(orderRepository.findById(5)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.updateStatus(5, "shipped", admin());

        assertEquals("SHIPPED", response.status());
        verify(orderRepository).save(order);
        verify(orderStatusHistoryRepository).save(any());
    }

    @Test
    void updateStatusSkipsWorkWhenStatusUnchanged() {
        Order order = order(5, "PENDING");
        when(orderRepository.findById(5)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.updateStatus(5, "pending", admin());

        assertEquals("PENDING", response.status());
        verify(orderRepository, never()).save(order);
        verify(orderStatusHistoryRepository, never()).save(any());
    }

    @Test
    void updateStatusRejectsInvalidStatus() {
        when(orderRepository.findById(5)).thenReturn(Optional.of(order(5, "PENDING")));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> orderService.updateStatus(5, "BOGUS", admin()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void updateStatusRejectsUnknownOrder() {
        when(orderRepository.findById(99)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> orderService.updateStatus(99, "SHIPPED", admin()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void getCustomerOrdersMapsHistory() {
        when(orderRepository.findByUserUserIdOrderByOrderIdDesc(1))
                .thenReturn(List.of(order(5, "PENDING"), order(4, "SHIPPED")));

        List<OrderResponse> result = orderService.getCustomerOrders(1);

        assertEquals(2, result.size());
        assertEquals(5, result.get(0).orderId());
    }

    @Test
    void createOrderPlacesOrderFromCart() {
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart()));
        when(cartItemRepository.findByCartCartId(10)).thenReturn(List.of(cartItem(2)));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order created = inv.getArgument(0);
            created.setOrderId(5);
            return created;
        });
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(inv -> {
            OrderItem item = inv.getArgument(0);
            item.setOrderItemId(44);
            return item;
        });

        OrderDetailResponse detail = orderService.createOrder(user(), orderRequest());

        assertEquals(5, detail.orderId());
        assertEquals("1 Main St, Springfield, 62704; Phone: +1 555 0100", detail.shippingAddress());
        assertEquals(BigDecimal.valueOf(50), detail.totalAmount());
        assertEquals(1, detail.items().size());
        assertEquals(44, detail.items().get(0).orderItemId());
        verify(cartItemRepository).deleteAll(any(List.class));
    }

    @Test
    void createOrderRejectsMissingCart() {
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> orderService.createOrder(user(), orderRequest()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void createOrderRejectsEmptyCart() {
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart()));
        when(cartItemRepository.findByCartCartId(10)).thenReturn(List.of());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> orderService.createOrder(user(), orderRequest()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void createOrderRejectsInactiveProduct() {
        Product inactive = product();
        inactive.setActive(false);
        CartItem item = new CartItem(cart(), inactive, 2);

        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart()));
        when(cartItemRepository.findByCartCartId(10)).thenReturn(List.of(item));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> orderService.createOrder(user(), orderRequest()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrderRejectsInsufficientStock() {
        Product lowStock = new Product(null, "Drill", BigDecimal.valueOf(25), 1, null);
        lowStock.setProductId(8);
        lowStock.setActive(true);
        CartItem item = new CartItem(cart(), lowStock, 2);

        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart()));
        when(cartItemRepository.findByCartCartId(10)).thenReturn(List.of(item));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> orderService.createOrder(user(), orderRequest()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void getOrderReturnsOwnOrder() {
        Order order = order(5, "PENDING");
        OrderItem orderItem = new OrderItem(order, product(), 2, BigDecimal.valueOf(25));
        orderItem.setOrderItemId(44);
        when(orderRepository.findById(5)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderOrderId(5)).thenReturn(List.of(orderItem));

        OrderDetailResponse detail = orderService.getOrder(user(), 5);

        assertEquals(5, detail.orderId());
        assertEquals(1, detail.items().size());
    }

    @Test
    void getOrderRejectsUnknownOrder() {
        when(orderRepository.findById(99)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> orderService.getOrder(user(), 99));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void getOrderRejectsAnotherUsersOrder() {
        User bob = new User("Bob", "bob@example.com", "pw", "CUSTOMER");
        bob.setUserId(9);
        Order foreignOrder = new Order(bob, LocalDate.now(), BigDecimal.valueOf(1), "PENDING", "addr");
        foreignOrder.setOrderId(5);
        when(orderRepository.findById(5)).thenReturn(Optional.of(foreignOrder));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> orderService.getOrder(user(), 5));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }
}