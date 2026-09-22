package com.jayarathna.powertools.dto;

import com.jayarathna.powertools.model.Product;

import java.math.BigDecimal;

public class ProductDto {

    private Integer productId;
    private String name;
    private BigDecimal price;
    private Integer stockQty;
    private String imageUrl;
    private String description;
    private String categoryId;
    private String categoryName;

    public ProductDto(Product product) {
        this.productId = product.getProductId();
        this.name = product.getName();
        this.price = product.getPrice();
        this.stockQty = product.getStockQty();
        this.imageUrl = product.getImageUrl();
        this.description = product.getDescription();
        this.categoryId = product.getCategory() != null
                ? product.getCategory().getCategoryId().toString()
                : null;
        this.categoryName = product.getCategory() != null
                ? product.getCategory().getCategoryName()
                : null;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStockQty() {
        return stockQty;
    }

    public void setStockQty(Integer stockQty) {
        this.stockQty = stockQty;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }
}
