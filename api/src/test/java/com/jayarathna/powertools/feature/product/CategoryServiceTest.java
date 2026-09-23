package com.jayarathna.powertools.feature.product;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private static Category category() {
        Category category = new Category();
        category.setCategoryId(UUID.randomUUID());
        category.setCategoryName("Saws");
        category.setCategoryDescription("Cutting tools");
        return category;
    }

    @Test
    void getAllCategoriesDelegates() {
        when(categoryRepository.findAll()).thenReturn(List.of(category()));

        assertEquals(1, categoryService.getAllCategories().size());
    }

    @Test
    void getCategoryByIdReturnsEntity() {
        UUID id = category().getCategoryId();
        when(categoryRepository.findById(id)).thenReturn(Optional.of(category()));

        assertTrue(categoryService.getCategoryById(id).isPresent());
        assertFalse(categoryService.getCategoryById(UUID.fromString("00000000-0000-0000-0000-000000000001")).isPresent());
    }

    @Test
    void createCategorySaves() {
        Category input = category();
        when(categoryRepository.save(input)).thenReturn(input);

        Category saved = categoryService.createCategory(input);

        assertEquals("Saws", saved.getCategoryName());
        verify(categoryRepository).save(input);
    }

    @Test
    void updateCategoryUpdatesExisting() {
        Category existing = category();
        Category input = new Category();
        input.setCategoryName("Circular Saws");
        input.setCategoryDescription("Blades");

        when(categoryRepository.findById(existing.getCategoryId())).thenReturn(Optional.of(existing));
        when(categoryRepository.save(existing)).thenReturn(existing);

        Category updated = categoryService.updateCategory(existing.getCategoryId(), input);

        assertEquals("Circular Saws", updated.getCategoryName());
        assertEquals("Blades", updated.getCategoryDescription());
    }

    @Test
    void updateCategoryThrowsWhenMissing() {
        UUID missingId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        when(categoryRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> categoryService.updateCategory(missingId, new Category()));
    }

    @Test
    void removeCategoryReturnsTrueWhenDeleted() {
        UUID id = category().getCategoryId();
        when(categoryRepository.existsById(id)).thenReturn(true);

        assertTrue(categoryService.removeCategory(id));
        verify(categoryRepository).deleteById(id);
    }

    @Test
    void removeCategoryReturnsFalseWhenMissing() {
        UUID id = UUID.fromString("00000000-0000-0000-0000-000000000003");
        when(categoryRepository.existsById(id)).thenReturn(false);

        assertFalse(categoryService.removeCategory(id));
    }
}