package com.jayarathna.powertools.integration;

import com.jayarathna.powertools.dto.CreateProductRequest;
import com.jayarathna.powertools.dto.ProductDto;
import com.jayarathna.powertools.dto.ProductResponse;
import com.jayarathna.powertools.dto.UpdateStockRequest;
import com.jayarathna.powertools.feature.product.Category;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Public catalog (products + categories) and admin product management,
 * verified through the running HTTP layer against the real database.
 */
class ProductCatalogIntegrationTest extends IntegrationTestBase {

    public static final UUID POWER_DRILLS = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567801");
    public static final UUID ANGLE_GRINDERS = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567802");

    @Test
    void listCategoriesReturnsSeededCategories() {
        ResponseEntity<List<Category>> response = listCategories();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(10);
        assertThat(response.getBody()).extracting(Category::getCategoryName)
                .contains("Power Drills", "Angle Grinders", "Circular Saws");
    }

    @Test
    void adminCreatesCategoryAndItAppearsInPublicList() {
        Category request = new Category();
        request.setCategoryName("Test Gear");
        request.setCategoryDescription("Integration-created category");

        ResponseEntity<Category> created =
                post("/api/categories", adminToken(), request, Category.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(created.getBody().getCategoryId()).isNotNull();

        assertThat(listCategories().getBody())
                .extracting(Category::getCategoryName)
                .contains("Test Gear");
    }

    @Test
    void customerCannotCreateCategory() {
        String token = customerToken();
        ResponseEntity<Map> denied =
                post("/api/categories", token, Map.of("categoryName", "Nope", "categoryDescription", "x"), Map.class);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void unauthenticatedCannotCreateCategoryOrProduct() {
        ResponseEntity<Map> category =
                post("/api/categories", null, Map.of("categoryName", "Nope"), Map.class);
        assertThat(category.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<Map> product =
                post("/api/admin/products", null, productRequest("P", "1.00", 1, POWER_DRILLS), Map.class);
        assertThat(product.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void emptyCatalogIsEmptyEnvelope() {
        ResponseEntity<ProductResponse> response =
                get("/api/products", null, ProductResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getProducts()).isEmpty();
        assertThat(response.getBody().getTotalElements()).isZero();
        assertThat(response.getBody().getPage()).isZero();
        assertThat(response.getBody().getSize()).isEqualTo(12);
        assertThat(response.getBody().isFirst()).isTrue();
        assertThat(response.getBody().isLast()).isTrue();
    }

    @Test
    void adminProductCrudRoundTrip() {
        ProductDto created = createProduct("Quantum Drill", "199.99", 10);
        assertThat(created.getProductId()).isNotNull();
        assertThat(created.getCategoryName()).isEqualTo("Power Drills");
        assertThat(created.getStockQty()).isEqualTo(10);

        ResponseEntity<ProductDto> fetched = get("/api/products/" + created.getProductId(), null, ProductDto.class);
        assertThat(fetched.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(fetched.getBody().getName()).isEqualTo("Quantum Drill");
        assertThat(fetched.getBody().getPrice()).isEqualByComparingTo("199.99");

        ProductDto updated = updateProduct(created.getProductId(), "Quantum Drill Pro", "249.00", 5);
        assertThat(updated.getName()).isEqualTo("Quantum Drill Pro");
        assertThat(updated.getPrice()).isEqualByComparingTo("249.00");
        assertThat(updated.getStockQty()).isEqualTo(5);

        ProductDto stocked = adjustStock(created.getProductId(), 3);
        assertThat(stocked.getStockQty()).isEqualTo(8);
    }

    @Test
    void adminProductCreateValidations() {
        ResponseEntity<Map> missingPrice =
                post("/api/admin/products", adminToken(), Map.of("categoryId", POWER_DRILLS.toString(),
                        "name", "No Price", "stockQty", 1), Map.class);
        assertThat(missingPrice.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> negativeStock =
                post("/api/admin/products", adminToken(), productRequest("Neg Stock", "9.99", -1, POWER_DRILLS), Map.class);
        assertThat(negativeStock.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> unknownCategory =
                post("/api/admin/products", adminToken(),
                        productRequest("Orphan", "9.99", 1, UUID.randomUUID()), Map.class);
        assertThat(unknownCategory.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<Map> zeroPrice =
                post("/api/admin/products", adminToken(), productRequest("Free", "0.00", 1, POWER_DRILLS), Map.class);
        assertThat(zeroPrice.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void duplicateProductNameIsRejected() {
        createProduct("Duplicate Drill", "10.00", 5);
        ResponseEntity<Map> duplicate =
                post("/api/admin/products", adminToken(), productRequest("Duplicate Drill", "12.00", 3, POWER_DRILLS), Map.class);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void customerCannotManageProducts() {
        String token = customerToken();
        ResponseEntity<Map> denied =
                post("/api/admin/products", token, productRequest("Nope", "1.00", 1, POWER_DRILLS), Map.class);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void searchAndCategoryFiltersWorkTogether() {
        createProductByName("Quantum Driver Alpha", "111.11");
        createProductByName("Quantum Driver Beta", "222.22");
        createProduct("Arc Grinder X", "88.88", 3, ANGLE_GRINDERS);

        ProductResponse search = searchProducts("quantum");
        assertThat(search.getTotalElements()).isEqualTo(2);

        ProductResponse categoryFilter = productsByCategory(POWER_DRILLS);
        assertThat(categoryFilter.getTotalElements()).isEqualTo(2);
        assertThat(categoryFilter.getProducts())
                .extracting(ProductDto::getName)
                .allMatch(name -> name.startsWith("Quantum"));

        ProductResponse combined =
                rest.getForObject("/api/products?search={s}&categoryId={c}", ProductResponse.class,
                        "driver", POWER_DRILLS);
        assertThat(combined.getTotalElements()).isEqualTo(2);
    }

    @Test
    void getUnknownProductIsNotFound() {
        ResponseEntity<Map> missing = get("/api/products/999999", null, Map.class);
        assertThat(missing.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void deletedProductDisappearsFromCatalog() {
        ProductDto created = createProduct("Disappearing Saw", "150.00", 4);
        ResponseEntity<Void> deleted = delete("/api/admin/products/" + created.getProductId(), adminToken());
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<Map> gone = get("/api/products/" + created.getProductId(), null, Map.class);
        assertThat(gone.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ProductResponse list = get("/api/products", null, ProductResponse.class).getBody();
        assertThat(list.getProducts()).noneMatch(p -> p.getProductId().equals(created.getProductId()));

        ResponseEntity<Map> stockAfterDelete =
                put("/api/admin/products/" + created.getProductId() + "/stock", adminToken(),
                        new UpdateStockRequest(1), Map.class);
        assertThat(stockAfterDelete.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void stockAdjustmentCannotGoBelowZero() {
        ProductDto created = createProduct("Stock Limited Drill", "20.00", 2);
        ResponseEntity<Map> denied =
                put("/api/admin/products/" + created.getProductId() + "/stock", adminToken(),
                        new UpdateStockRequest(-3), Map.class);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateUnknownProductOrCategoryMissingReturnsError() {
        ResponseEntity<Map> missingProduct =
                put("/api/admin/products/999999", adminToken(),
                        productRequest("Ghost", "1.00", 1, POWER_DRILLS), Map.class);
        assertThat(missingProduct.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private String customerToken() {
        String email = customerEmail();
        registerCustomer(email);
        return loginAndToken(email, "password123");
    }

    private ResponseEntity<List<Category>> listCategories() {
        return rest.exchange("/api/categories", HttpMethod.GET, null,
                new ParameterizedTypeReference<List<Category>>() {
                });
    }

    private Map<String, Object> productRequest(String name, String price, int stock, UUID categoryId) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("categoryId", categoryId.toString());
        request.put("name", name);
        request.put("price", new BigDecimal(price));
        request.put("stockQty", stock);
        request.put("imageUrl", null);
        request.put("description", "integration product");
        return request;
    }

    private ProductDto createProduct(String name, String price, int stock) {
        return createProduct(name, price, stock, POWER_DRILLS);
    }

    private ProductDto createProduct(String name, String price, int stock, UUID categoryId) {
        ResponseEntity<ProductDto> response = post("/api/admin/products", adminToken(),
                productRequest(name, price, stock, categoryId), ProductDto.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
    }

    private void createProductByName(String name, String price) {
        createProduct(name, price, 5);
    }

    private ProductDto updateProduct(int id, String name, String price, int stock) {
        ResponseEntity<ProductDto> response = put("/api/admin/products/" + id, adminToken(),
                productRequest(name, price, stock, POWER_DRILLS), ProductDto.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private ProductDto adjustStock(int id, int adjustment) {
        ResponseEntity<ProductDto> response = put("/api/admin/products/" + id + "/stock", adminToken(),
                new UpdateStockRequest(adjustment), ProductDto.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private ProductResponse searchProducts(String term) {
        return rest.getForObject("/api/products?search={term}", ProductResponse.class, term);
    }

    private ProductResponse productsByCategory(UUID categoryId) {
        return rest.getForObject("/api/products?categoryId={id}", ProductResponse.class, categoryId);
    }
}