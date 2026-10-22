package com.example.board.payment;

/** PG 승인·조회 응답. spec-v2 §7. */
public record PgApproval(String paymentKey, Status status, int amount, String approvedAt) {

    public enum Status {
        DONE, FAILED, PENDING
    }
}
