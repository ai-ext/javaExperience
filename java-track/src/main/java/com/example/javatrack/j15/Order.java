package com.example.javatrack.j15;

/**
 * 주어진 record: 고치지 않는다.
 * 주문 한 건. couponCode가 null이면 쿠폰 없이 산 주문이다. price는 검사하지 않은 값이다.
 */
public record Order(String orderId, long price, String couponCode) {
}
