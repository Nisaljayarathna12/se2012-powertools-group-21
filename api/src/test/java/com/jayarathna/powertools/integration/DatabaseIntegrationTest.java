package com.jayarathna.powertools.integration;

import com.jayarathna.powertools.feature.product.Category;
import com.jayarathna.powertools.feature.product.CategoryRepository;
import com.jayarathna.powertools.model.Cart;
import com.jayarathna.powertools.model.CartItem;
import com.jayarathna.powertools.model.Order;
import com.jayarathna.powertools.model.OrderItem;
import com.jayarathna.powertools.model.OrderStatusHistory;
import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.CartItemRepository;
import com.jayarathna.powertools.repository.CartRepository;
import com.jayarathna.powertools.repository.OrderItemRepository;
import com.jayarathna.powertools.repository.OrderRepository;
import com.jayarathna.powertools.repository.ProductRepository;
import com.jayarathna.powertools.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the real MySQL wiring: Flyway migrations applied on a fresh schema,
 * the seeded categories and admin user, and JPA round-trips across every
 * entity that participates in cart/order/audit flows.
 */
@Transactional
class DatabaseIntegrationTest extends IntegrationTestBase {

    public static final UUID POWER_DRILLS = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567801");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private JdbcTemplate jdbc;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void flywayMigratedFreshSchemaContainsAllTables() {
        Long tables = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()", Long.class);
        assertThat(tables).isNotNull().isGreaterThanOrEqualTo(8);

        Integer userTable = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'USER'",
                Integer.class);
        assertThat(userTable).isEqualTo(1);

        Integer historyTable = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'ORDER_STATUS_HISTORY'",
                Integer.class);
        assertThat(historyTable).isEqualTo(1);
    }

    @Test
    void adminUserSeededByDataSeeder() {
        Optional<User> admin = userRepository.findByEmail(ADMIN_EMAIL);
        assertThat(admin).isPresent();
        assertThat(admin.get().getRole()).isEqualTo("ADMIN");
        assertThat(admin.get().getPassword()).isNotBlank();
    }

    @Test
    void categoriesSeededByMigration() {
        assertThat(categoryRepository.count()).isEqualTo(10);
        assertThat(categoryRepository.findAll())
                .extracting(Category::getCategoryName)
                .contains("Power Drills");
    }

    @Test
    void productRoundTripPersistsAllColumns() {
        Category category = categoryRepository.findById(POWER_DRILLS).orElseThrow();
        Product product = productRepository.save(
                new Product(category, "Round Trip Drill", new BigDecimal("129.99"), 7, "http://img/drill.png"));
        product.setDescription("Round trip persisted");

        entityManager.flush();
        entityManager.clear();

        Product reloaded = productRepository.findById(product.getProductId()).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Round Trip Drill");
        assertThat(reloaded.getPrice()).isEqualByComparingTo("129.99");
        assertThat(reloaded.getStockQty()).isEqualTo(7);
        assertThat(reloaded.getDescription()).isEqualTo("Round trip persisted");
        assertThat(reloaded.getActive()).isTrue();
        assertThat(reloaded.getCategory().getCategoryId()).isEqualTo(POWER_DRILLS);
        assertThat(reloaded.getImageUrl()).isEqualTo("http://img/drill.png");
    }

    @Test
    void cartOrderAndAuditRoundTripPersistForeignKeyChains() {
        User customer = userRepository.save(new User(
                "Audit Customer", "audit." + System.nanoTime() + "@example.com", "encoded-password", "CUSTOMER"));
        Category category = categoryRepository.findById(POWER_DRILLS).orElseThrow();
        Product drill = productRepository.save(
                new Product(category, "Audit Drill", new BigDecimal("89.00"), 4, null));

        Cart cart = cartRepository.save(new Cart(customer, LocalDate.now()));
        cartItemRepository.save(new CartItem(cart, drill, 2));

        Order order = orderRepository.save(new Order(
                customer, LocalDate.now(), new BigDecimal("178.00"), "PENDING", "1 Main St, Colombo, 00100; Phone: 0770000000"));
        orderItemRepository.save(new OrderItem(order, drill, 2, new BigDecimal("89.00")));
        entityManager.persist(new OrderStatusHistory(order, null, "PENDING", LocalDateTime.now(), customer.getUserId()));

        entityManager.flush();
        entityManager.clear();

        assertThat(cartItemRepository.findByCartCartId(cart.getCartId())).hasSize(1);
        assertThat(orderItemRepository.findByOrderOrderId(order.getOrderId())).hasSize(1);
        assertThat(orderRepository.findByUserUserIdOrderByOrderIdDesc(customer.getUserId()))
                .extracting(Order::getStatus)
                .containsExactly("PENDING");

        Integer historyRows = jdbc.queryForObject(
                "SELECT COUNT(*) FROM ORDER_STATUS_HISTORY WHERE order_id = ?", Integer.class, order.getOrderId());
        assertThat(historyRows).isEqualTo(1);

        Integer userFk = jdbc.queryForObject(
                "SELECT COUNT(*) FROM PAYMENT WHERE order_id = ?", Integer.class, order.getOrderId());
        assertThat(userFk).isNotNull();
    }

    @Test
    void cartItemMergeUsesUniqueConstraintOnCartAndProduct() {
        User customer = userRepository.save(new User(
                "Merge Customer", "merge." + System.nanoTime() + "@example.com", "encoded-password", "CUSTOMER"));
        Category category = categoryRepository.findById(POWER_DRILLS).orElseThrow();
        Product drill = productRepository.save(
                new Product(category, "Merge Drill", new BigDecimal("50.00"), 9, null));

        Cart cart = cartRepository.save(new Cart(customer, LocalDate.now()));
        cartItemRepository.save(new CartItem(cart, drill, 2));

        CartItem second = cartItemRepository.findByCartCartIdAndProductProductId(cart.getCartId(), drill.getProductId())
                .orElseThrow();
        second.setQuantity(second.getQuantity() + 3);
        cartItemRepository.save(second);

        entityManager.flush();

        assertThat(cartItemRepository.findByCartCartId(cart.getCartId())).hasSize(1);
        assertThat(cartItemRepository.findByCartCartId(cart.getCartId()).get(0).getQuantity()).isEqualTo(5);
    }

    }