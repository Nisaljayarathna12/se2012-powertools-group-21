package com.jayarathna.powertools.repository;

import com.jayarathna.powertools.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    Optional<CartItem> findByCartCartIdAndProductProductId(Integer cartId, Integer productId);

    List<CartItem> findByCartCartId(Integer cartId);
}