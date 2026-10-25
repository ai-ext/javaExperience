package com.example.practice.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        Long categoryId,
        String name,
        String productType,
        BigDecimal price,
        Integer stock,
        String saleStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getCategoryId(),
                product.getName(),
                product.getProductType(),
                product.getPrice(),
                product.getStock(),
                product.getSaleStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
