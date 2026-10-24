package com.example.board.shop;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record OrderRequest(
        @NotNull @Positive Long itemId,
        @NotNull @Min(1) @Max(10) Integer quantity,
        @Positive Long memberCouponId) {
}
