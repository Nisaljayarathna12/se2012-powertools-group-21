package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.CartCountResponse;
import com.jayarathna.powertools.dto.CartResponse;
import com.jayarathna.powertools.model.Cart;
import com.jayarathna.powertools.model.CartItem;
import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.CartItemRepository;
import com.jayarathna.powertools.repository.CartRepository;
import com.jayarathna.powertools.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CartService cartService;

    private static User user() {
        User user = new User("Alice", "alice@example.com", "pw", "CUSTOMER");
        user.setUserId(1);
        return user;
    }

    private static Cart cart() {
        Cart cart = new Cart(user(), LocalDate.now());
        cart.setCartId(10);
        return cart;
    }

    private static Product product() {
        Product product = new Product(null, "Drill", BigDecimal.valueOf(50), 10, "img.png");
        product.setProductId(7);
        return product;
    }

    private static CartItem item(Product product, int quantity) {
        CartItem item = new CartItem(cart(), product, quantity);
        item.setCartItemId(3);
        return item;
    }

    @Test
    void getCartReturnsExistingCartWithTotals() {
        Cart cart = cart();
        Product p = product();
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartCartId(10)).thenReturn(List.of(item(p, 2), item(p, 1)));

        CartResponse response = cartService.getCart(user());

        assertEquals(10, response.cartId());
        assertEquals(2, response.itemCount());
        assertEquals(3, response.totalQuantity());
        assertEquals(BigDecimal.valueOf(150), response.totalAmount());
    }

    @Test
    void getCartCreatesCartWhenMissing() {
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> {
            Cart created = inv.getArgument(0);
            created.setCartId(11);
            return created;
        });
        when(cartItemRepository.findByCartCartId(11)).thenReturn(List.of());

        CartResponse response = cartService.getCart(user());

        assertEquals(11, response.cartId());
        assertEquals(0, response.itemCount());
        assertEquals(BigDecimal.ZERO, response.totalAmount());
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    void getCountReturnsZeroWhenNoCart() {
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.empty());

        CartCountResponse response = cartService.getCount(user());

        assertEquals(0, response.itemCount());
        assertEquals(0, response.totalQuantity());
    }

    @Test
    void getCountSumsQuantities() {
        Cart cart = cart();
        Product p = product();
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartCartId(10)).thenReturn(List.of(item(p, 4), item(p, 2)));

        CartCountResponse response = cartService.getCount(user());

        assertEquals(2, response.itemCount());
        assertEquals(6, response.totalQuantity());
    }

    @Test
    void addItemRejectsInvalidQuantity() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.addItem(user(), 7, 0));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void addItemRejectsUnknownProduct() {
        when(productRepository.findByProductIdAndActiveTrue(7)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.addItem(user(), 7, 1));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void addItemRejectsQuantityAboveStock() {
        when(productRepository.findByProductIdAndActiveTrue(7)).thenReturn(Optional.of(product()));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.addItem(user(), 7, 11));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void addItemCreatesNewItem() {
        Cart cart = cart();
        Product p = product();
        when(productRepository.findByProductIdAndActiveTrue(7)).thenReturn(Optional.of(p));
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartCartIdAndProductProductId(10, 7)).thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(cartItemRepository.findByCartCartId(10)).thenAnswer(inv ->
                List.of(item(p, 3)));

        CartResponse response = cartService.addItem(user(), 7, 3);

        assertEquals(1, response.itemCount());
        assertEquals(3, response.totalQuantity());
        assertEquals(BigDecimal.valueOf(150), response.totalAmount());
    }

    @Test
    void addItemRejectsCombinedQuantityAboveStock() {
        Cart cart = cart();
        Product p = product();
        CartItem existing = item(p, 8);
        when(productRepository.findByProductIdAndActiveTrue(7)).thenReturn(Optional.of(p));
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartCartIdAndProductProductId(10, 7)).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.addItem(user(), 7, 3));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void updateItemQuantitySucceedsForOwnedItem() {
        Cart cart = cart();
        Product p = product();
        CartItem existing = item(p, 2);
        when(cartItemRepository.findById(3)).thenReturn(Optional.of(existing));
        when(cartItemRepository.save(existing)).thenReturn(existing);
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartCartId(10)).thenReturn(List.of(item(p, 5)));

        CartResponse response = cartService.updateItemQuantity(user(), 3, 5);

        assertEquals(5, response.totalQuantity());
    }

    @Test
    void updateItemQuantityRejectsInvalidQuantity() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.updateItemQuantity(user(), 3, 0));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void updateItemQuantityRejectsUnknownItem() {
        when(cartItemRepository.findById(3)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.updateItemQuantity(user(), 3, 2));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void updateItemQuantityRejectsItemOfAnotherUser() {
        User bob = new User("Bob", "bob@example.com", "pw", "CUSTOMER");
        bob.setUserId(9);
        Cart otherCart = new Cart(bob, LocalDate.now());
        otherCart.setCartId(20);
        CartItem foreignItem = new CartItem(otherCart, product(), 2);
        foreignItem.setCartItemId(3);
        when(cartItemRepository.findById(3)).thenReturn(Optional.of(foreignItem));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.updateItemQuantity(user(), 3, 2));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void updateItemQuantityRejectsAboveStock() {
        Product p = product();
        CartItem existing = item(p, 2);
        when(cartItemRepository.findById(3)).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.updateItemQuantity(user(), 3, 11));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void removeItemDeletesOwnedItem() {
        Cart cart = cart();
        CartItem existing = item(product(), 2);
        when(cartItemRepository.findById(3)).thenReturn(Optional.of(existing));
        when(cartItemRepository.findByCartCartId(10)).thenReturn(List.of());
        when(cartRepository.findByUserUserId(1)).thenReturn(Optional.of(cart));

        CartResponse response = cartService.removeItem(user(), 3);

        assertEquals(0, response.itemCount());
        verify(cartItemRepository).delete(existing);
    }

    @Test
    void removeItemRejectsUnknownItem() {
        when(cartItemRepository.findById(3)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.removeItem(user(), 3));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void removeItemRejectsItemOfAnotherUser() {
        User bob = new User("Bob", "bob@example.com", "pw", "CUSTOMER");
        bob.setUserId(9);
        Cart otherCart = new Cart(bob, LocalDate.now());
        otherCart.setCartId(20);
        CartItem foreignItem = new CartItem(otherCart, product(), 2);
        foreignItem.setCartItemId(3);
        when(cartItemRepository.findById(3)).thenReturn(Optional.of(foreignItem));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> cartService.removeItem(user(), 3));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(cartItemRepository, never()).delete(any(CartItem.class));
    }
}