package com.jayarathna.powertools.feature.product;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAllCategories(){
        return categoryRepository.findAll();
    }

    public Optional<Category> getCategoryById(UUID id){
        return categoryRepository.findById(id);
    }

    public Category createCategory(Category category){
        return categoryRepository.save(category);
    }

    public Category updateCategory(UUID id, Category updatedCategory){
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        existingCategory.setCategoryName(updatedCategory.getCategoryName());
        existingCategory.setCategoryDescription(updatedCategory.getCategoryDescription());

        return categoryRepository.save(existingCategory);
    }

    public boolean removeCategory(UUID id){
        if (!categoryRepository.existsById(id)){
            return false;
        }

        categoryRepository.deleteById(id);
        return true;
    }
}
