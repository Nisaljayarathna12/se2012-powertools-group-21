package com.jayarathna.powertools.repository;

import com.jayarathna.powertools.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    Optional<Product> findByProductIdAndActiveTrue(Integer productId);

    boolean existsByNameIgnoreCaseAndActiveTrue(String name);

    boolean existsByNameIgnoreCaseAndActiveTrueAndProductIdNot(String name, Integer productId);

    Page<Product> findAllByActiveTrue(Pageable pageable);

    Page<Product> findByNameContainingIgnoreCaseAndActiveTrue(String name, Pageable pageable);

    Page<Product> findByCategoryCategoryIdAndActiveTrue(UUID categoryId, Pageable pageable);

    Page<Product> findByCategoryCategoryIdAndNameContainingIgnoreCaseAndActiveTrue(UUID categoryId, String name, Pageable pageable);

    List<Product> findTop5ByStockQtyLessThanEqualAndActiveTrueOrderByStockQtyAsc(Integer threshold);

    long countByStockQtyLessThanEqualAndActiveTrue(Integer threshold);

    long countByActiveTrue();
}