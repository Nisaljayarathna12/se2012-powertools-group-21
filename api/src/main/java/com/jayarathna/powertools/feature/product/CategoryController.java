package com.jayarathna.powertools.feature.product;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private  final CategoryService categoryService;

    // Create category
    @PostMapping
    public ResponseEntity<Category> createCategory(
            @RequestBody Category category) {

        Category createdCategory = categoryService.createCategory(category);

        return ResponseEntity.ok(createdCategory);
    }

}
