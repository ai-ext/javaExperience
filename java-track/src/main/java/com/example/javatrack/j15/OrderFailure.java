package com.example.javatrack.j15;

/** 주어진 record: 고치지 않는다. 계산에 실패한 주문 한 건과 그 사유. */
public record OrderFailure(String orderId, String reason) {
}
