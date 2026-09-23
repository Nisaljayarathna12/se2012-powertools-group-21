package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.CreateProductRequest;
import com.jayarathna.powertools.dto.ProductDto;
import com.jayarathna.powertools.feature.product.Category;
import com.jayarathna.powertools.feature.product.CategoryRepository;
import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    private static final UUID CATEGORY_ID = UUID.randomUUID();

    private static Category category() {
        Category category = new Category();
        category.setCategoryId(CATEGORY_ID);
        category.setCategoryName("Drills");
        return category;
    }

    private static Product product() {
        Product product = new Product(category(), "Cordless Drill", BigDecimal.valueOf(99.5), 4, "img.png");
        product.setProductId(1);
        product.setDescription("desc");
        return product;
    }

    private static CreateProductRequest request() {
        return new CreateProductRequest(CATEGORY_ID, "  Cordless Drill  ",
                BigDecimal.valueOf(99.5), 4, "img.png", "desc");
    }

    @Test
    void getProductsReadsActiveProductsPaged() {
        Page<Product> page = new PageImpl<>(List.of(product()));
        when(productRepository.findAllByActiveTrue(any(Pageable.class))).thenReturn(page);

        Page<Product> result = productService.getProducts(0, 12);

        assertEquals(1, result.getTotalElements());
        verify(productRepository).findAllByActiveTrue(any(Pageable.class));
    }

    @Test
    void getProductsByCategoryDelegates() {
        UUID categoryId = category().getCategoryId();
        when(productRepository.findByCategoryCategoryIdAndActiveTrue(eq(categoryId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product())));

        Page<Product> result = productService.getProductsByCategory(categoryId, 0, 12);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void searchProductsDelegates() {
        when(productRepository.findByNameContainingIgnoreCaseAndActiveTrue(eq("drill"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product())));

        Page<Product> result = productService.searchProducts("drill", 0, 12);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void searchProductsInCategoryDelegates() {
        UUID categoryId = category().getCategoryId();
        when(productRepository.findByCategoryCategoryIdAndNameContainingIgnoreCaseAndActiveTrue(
                eq(categoryId), eq("drill"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product())));

        Page<Product> result = productService.searchProductsInCategory(categoryId, "drill", 0, 12);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getProductReturnsPresentWhenFound() {
        when(productRepository.findByProductIdAndActiveTrue(1)).thenReturn(Optional.of(product()));

        Optional<Product> result = productService.getProduct(1);

        assertTrue(result.isPresent());
        assertFalse(productService.getProduct(999).isPresent());
    }

    @Test
    void createProductSavesTrimmedProduct() {
        CreateProductRequest request = request();
        when(productRepository.existsByNameIgnoreCaseAndActiveTrue("Cordless Drill")).thenReturn(false);
        when(categoryRepository.findById(request.categoryId())).thenReturn(Optional.of(category()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductDto dto = productService.createProduct(request);

        assertEquals("Cordless Drill", dto.getName());
        assertEquals(4, dto.getStockQty());
        assertEquals("Drills", dto.getCategoryName());
    }

    @Test
    void createProductRejectsDuplicateName() {
        when(productRepository.existsByNameIgnoreCaseAndActiveTrue("Cordless Drill")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> productService.createProduct(request()));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProductRejectsMissingCategory() {
        when(productRepository.existsByNameIgnoreCaseAndActiveTrue("Cordless Drill")).thenReturn(false);
        when(categoryRepository.findById(request().categoryId())).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> productService.createProduct(request()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void updateProductUpdatesAllFields() {
        Product existing = product();
        when(productRepository.findByProductIdAndActiveTrue(1)).thenReturn(Optional.of(existing));
        when(productRepository.existsByNameIgnoreCaseAndActiveTrueAndProductIdNot("Cordless Drill", 1))
                .thenReturn(false);
        when(categoryRepository.findById(request().categoryId())).thenReturn(Optional.of(category()));
        when(productRepository.save(existing)).thenReturn(existing);

        ProductDto dto = productService.updateProduct(1, request());

        assertEquals("Cordless Drill", dto.getName());
    }

    @Test
    void updateProductRejectsUnknownProduct() {
        when(productRepository.findByProductIdAndActiveTrue(99)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> productService.updateProduct(99, request()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void updateProductRejectsDuplicateName() {
        when(productRepository.findByProductIdAndActiveTrue(1)).thenReturn(Optional.of(product()));
        when(productRepository.existsByNameIgnoreCaseAndActiveTrueAndProductIdNot("Cordless Drill", 1))
                .thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> productService.updateProduct(1, request()));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void deleteProductDeactivatesInsteadOfRemoving() {
        when(productRepository.findByProductIdAndActiveTrue(1)).thenReturn(Optional.of(product()));

        productService.deleteProduct(1);

        verify(productRepository).save(org.mockito.ArgumentMatchers.argThat(p -> !p.getActive()));
    }

    @Test
    void deleteProductRejectsUnknownProduct() {
        when(productRepository.findByProductIdAndActiveTrue(1)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> productService.deleteProduct(1));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void adjustStockIncreasesAndDecreasesWithinBounds() {
        when(productRepository.findByProductIdAndActiveTrue(1)).thenReturn(Optional.of(product()));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductDto increased = productService.adjustStock(1, 3);
        assertEquals(7, increased.getStockQty());

        when(productRepository.findByProductIdAndActiveTrue(1)).thenReturn(Optional.of(product()));
        ProductDto decreased = productService.adjustStock(1, -1);
        assertEquals(3, decreased.getStockQty());
    }

    @Test
    void adjustStockRejectsNegativeResult() {
        when(productRepository.findByProductIdAndActiveTrue(1)).thenReturn(Optional.of(product()));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> productService.adjustStock(1, -10));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void adjustStockRejectsUnknownProduct() {
        when(productRepository.findByProductIdAndActiveTrue(99)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> productService.adjustStock(99, 1));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }
}