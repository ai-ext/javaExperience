package com.example.javatrack.j13;

/**
 * 주어진 record: 고치지 않는다. 회원이 가진 쿠폰.
 *
 * @param type  쿠폰 종류 문자열: "FIXED"(정액), "RATE"(정률), "FIRST_ORDER"(첫 주문). 모르는 값이 섞여 있을 수 있다
 * @param value 정액·첫 주문이면 깎을 금액(원), 정률이면 퍼센트
 */
public record Coupon(String type, int value) {
}
