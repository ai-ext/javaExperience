package com.example.javatrack.j08;

/**
 * 주어진 record: 고치지 않는다.
 * 포인트 충전 요청 한 건. 검사하지 않은 값이 그대로 들어 있다.
 */
public record ChargeRequest(String idempotencyKey, int amount) {
}
