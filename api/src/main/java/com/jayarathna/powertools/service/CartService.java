package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.CartCountResponse;
import com.jayarathna.powertools.dto.CartItemResponse;
import com.jayarathna.powertools.dto.CartResponse;
import com.jayarathna.powertools.model.Cart;
import com.jayarathna.powertools.model.CartItem;
import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.CartItemRepository;
import com.jayarathna.powertools.repository.CartRepository;
import com.jayarathna.powertools.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public CartResponse getCart(User user) {
        Cart cart = findOrCreateCart(user);
        List<CartItemResponse> items = cartItemRepository.findByCartCartId(cart.getCartId())
                .stream()
                .map(CartItemResponse::new)
                .toList();

        return toCartResponse(cart, items);
    }

    @Transactional(readOnly = true)
    public CartCountResponse getCount(User user) {
        Cart cart = cartRepository.findByUserUserId(user.getUserId()).orElse(null);

        if (cart == null) {
            return new CartCountResponse(0, 0);
        }

        List<CartItem> items = cartItemRepository.findByCartCartId(cart.getCartId());
        int itemCount = items.size();
        int totalQuantity = items.stream().mapToInt(CartItem::getQuantity).sum();

        return new CartCountResponse(itemCount, totalQuantity);
    }

    @Transactional
    public CartResponse addItem(User user, Integer productId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
        }

        Product product = productRepository.findByProductIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (product.getStockQty() < quantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only " + product.getStockQty() + " units available");
        }

        Cart cart = findOrCreateCart(user);

        CartItem item = cartItemRepository
                .findByCartCartIdAndProductProductId(cart.getCartId(), productId)
                .orElse(new CartItem(cart, product, 0));

        int newQuantity = item.getQuantity() + quantity;

        if (newQuantity > product.getStockQty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only " + product.getStockQty() + " units available");
        }

        item.setQuantity(newQuantity);
        cartItemRepository.save(item);

        return getCart(user);
    }

    @Transactional
    public CartResponse updateItemQuantity(User user, Integer cartItemId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
        }

        CartItem item = findOwnedItem(user, cartItemId);

        if (item.getProduct().getStockQty() < quantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only " + item.getProduct().getStockQty() + " units available");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        return getCart(user);
    }

    @Transactional
    public CartResponse removeItem(User user, Integer cartItemId) {
        CartItem item = findOwnedItem(user, cartItemId);
        cartItemRepository.delete(item);
        return getCart(user);
    }

    private CartItem findOwnedItem(User user, Integer cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));

        if (!item.getCart().getUser().getUserId().equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found");
        }

        return item;
    }

    private Cart findOrCreateCart(User user) {
        return cartRepository.findByUserUserId(user.getUserId())
                .orElseGet(() -> cartRepository.save(new Cart(user, LocalDate.now())));
    }

    private CartResponse toCartResponse(Cart cart, List<CartItemResponse> items) {
        int totalQuantity = items.stream().mapToInt(CartItemResponse::quantity).sum();
        BigDecimal totalAmount = items.stream()
                .map(CartItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(
                cart.getCartId(),
                items,
                items.size(),
                totalQuantity,
                totalAmount
        );
    }
}