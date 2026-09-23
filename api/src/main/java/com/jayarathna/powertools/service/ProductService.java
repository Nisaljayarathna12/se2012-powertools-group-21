package com.jayarathna.powertools.service;

import com.jayarathna.powertools.dto.CreateProductRequest;
import com.jayarathna.powertools.dto.ProductDto;
import com.jayarathna.powertools.feature.product.Category;
import com.jayarathna.powertools.feature.product.CategoryRepository;
import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public Page<Product> getProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("productId").ascending());
        return productRepository.findAllByActiveTrue(pageable);
    }

    public Page<Product> getProductsByCategory(UUID categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("productId").ascending());
        return productRepository.findByCategoryCategoryIdAndActiveTrue(categoryId, pageable);
    }

    public Page<Product> searchProducts(String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("productId").ascending());
        return productRepository.findByNameContainingIgnoreCaseAndActiveTrue(name, pageable);
    }

    public Page<Product> searchProductsInCategory(UUID categoryId, String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("productId").ascending());
        return productRepository.findByCategoryCategoryIdAndNameContainingIgnoreCaseAndActiveTrue(categoryId, name, pageable);
    }

    public java.util.Optional<Product> getProduct(int productId) {
        return productRepository.findByProductIdAndActiveTrue(productId);
    }

    public ProductDto createProduct(CreateProductRequest request) {
        String name = request.name().trim();

        if (productRepository.existsByNameIgnoreCaseAndActiveTrue(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A product with this name already exists");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        Product product = new Product(category, name, request.price(), request.stockQty(), request.imageUrl());
        product.setDescription(request.description());

        return new ProductDto(productRepository.save(product));
    }

    public ProductDto updateProduct(int productId, CreateProductRequest request) {
        Product product = productRepository.findByProductIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        String name = request.name().trim();

        if (productRepository.existsByNameIgnoreCaseAndActiveTrueAndProductIdNot(name, productId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A product with this name already exists");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        product.setCategory(category);
        product.setName(name);
        product.setPrice(request.price());
        product.setStockQty(request.stockQty());
        product.setImageUrl(request.imageUrl());
        product.setDescription(request.description());

        return new ProductDto(productRepository.save(product));
    }

    public void deleteProduct(int productId) {
        Product product = productRepository.findByProductIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        product.setActive(false);
        productRepository.save(product);
    }

    public ProductDto adjustStock(int productId, int adjustment) {
        Product product = productRepository.findByProductIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        int newStockQty = product.getStockQty() + adjustment;

        if (newStockQty < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot reduce stock below zero");
        }

        product.setStockQty(newStockQty);
        return new ProductDto(productRepository.save(product));
    }
}
