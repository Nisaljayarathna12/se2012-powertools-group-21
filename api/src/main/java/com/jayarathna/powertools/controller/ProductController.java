package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.dto.ProductDto;
import com.jayarathna.powertools.dto.ProductResponse;
import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProduct(@PathVariable int id) {
        ProductDto product = productService.getProduct(id)
                .map(ProductDto::new)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return ResponseEntity.ok(product);
    }

    @GetMapping
    public ResponseEntity<ProductResponse> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId) {

        Page<Product> productPage;

        boolean hasSearch = search != null && !search.trim().isEmpty();
        boolean hasCategory = categoryId != null;

        if (hasSearch && hasCategory) {
            productPage = productService.searchProductsInCategory(categoryId, search.trim(), page, size);
        } else if (hasSearch) {
            productPage = productService.searchProducts(search.trim(), page, size);
        } else if (hasCategory) {
            productPage = productService.getProductsByCategory(categoryId, page, size);
        } else {
            productPage = productService.getProducts(page, size);
        }

        List<ProductDto> productDtos = productPage.getContent()
                .stream()
                .map(ProductDto::new)
                .toList();

        ProductResponse response = new ProductResponse(
                productDtos,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                productPage.isFirst(),
                productPage.isLast()
        );

        return ResponseEntity.ok(response);
    }
}
