package com.example.board.payment;

/** UNKNOWN은 실패가 아니라 결과 불명이다. 콜백이나 PG 조회로만 확정한다. */
public enum PgPaymentStatus {
    REQUESTED, DONE, FAILED, UNKNOWN
}
