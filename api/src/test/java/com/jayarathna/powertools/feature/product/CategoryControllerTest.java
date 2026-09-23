package com.jayarathna.powertools.feature.product;

import com.jayarathna.powertools.repository.UserRepository;
import com.jayarathna.powertools.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private CategoryService categoryService;

    @Test
    void getAllCategoriesReturnsCategoriesWithIds() throws Exception {
        Category category = new Category();
        category.setCategoryId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        category.setCategoryName("Drills");
        category.setCategoryDescription("Power drilling tools");

        when(categoryService.getAllCategories()).thenReturn(List.of(category));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].categoryId").value("11111111-1111-1111-1111-111111111111"))
                .andExpect(jsonPath("$[0].categoryName").value("Drills"))
                .andExpect(jsonPath("$[0].categoryDescription").value("Power drilling tools"));
    }

    @Test
    void createCategoryReturnsCreatedCategory() throws Exception {
        Category category = new Category();
        category.setCategoryId(UUID.fromString("22222222-2222-2222-2222-222222222222"));
        category.setCategoryName("Saws");

        when(categoryService.createCategory(org.mockito.ArgumentMatchers.any(Category.class)))
                .thenReturn(category);

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryName\":\"Saws\",\"categoryDescription\":\"Cutting tools\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryName").value("Saws"));
    }
}