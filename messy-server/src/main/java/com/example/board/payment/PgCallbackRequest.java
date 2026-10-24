package com.example.board.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record PgCallbackRequest(
        @NotBlank String orderId,
        @NotBlank @Size(max = 64) String paymentKey,
        @NotNull @Pattern(regexp = "DONE|FAILED") String status,
        @NotNull @Positive Integer amount) {
}
