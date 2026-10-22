package com.example.board.payment;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import com.example.board.common.MultipleOf;

public record ChargeRequest(@NotNull @Min(1000) @Max(1000000) @MultipleOf(1000) Integer amount) {
}
