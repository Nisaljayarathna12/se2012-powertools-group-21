package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.model.Product;
import com.jayarathna.powertools.repository.UserRepository;
import com.jayarathna.powertools.service.JwtService;
import com.jayarathna.powertools.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Validates the product list contract shared with the frontend
 * ({@code web/lib/api.ts}: ProductResponse).
 */
@WebMvcTest(ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductListContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private ProductService productService;

    @Test
    void productListMatchesFrontendProductResponseShape() throws Exception {
        Product product = new Product(null, "Cordless Drill", BigDecimal.valueOf(129.99), 5, "drill.jpg");
        product.setProductId(7);
        product.setDescription("Desc");

        when(productService.getProducts(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(product), PageRequest.of(0, 12), 1));

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products[0].productId").value(7))
                .andExpect(jsonPath("$.products[0].name").value("Cordless Drill"))
                .andExpect(jsonPath("$.products[0].price").value(129.99))
                .andExpect(jsonPath("$.products[0].stockQty").value(5))
                .andExpect(jsonPath("$.products[0].imageUrl").value("drill.jpg"))
                .andExpect(jsonPath("$.products[0].description").value("Desc"))
                .andExpect(jsonPath("$.products[0].categoryId").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.products[0].categoryName").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(12))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(true));
    }
}