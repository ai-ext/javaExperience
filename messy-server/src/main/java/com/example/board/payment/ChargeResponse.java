package com.example.board.payment;

public record ChargeResponse(String orderId, int amount, PgPaymentStatus status, long balance) {
}
