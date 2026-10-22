package com.example.javatrack.j13;

/**
 * 주어진 인터페이스: 고치지 않는다. 쿠폰 종류 하나의 할인 규칙.
 * 쿠폰 종류가 늘면 if-else를 고치지 않고 이 인터페이스의 구현을 하나 더한다.
 */
public interface DiscountPolicy {

    /** 이 정책이 맡는 쿠폰 종류인가. */
    boolean supports(Coupon coupon);

    /** 할인액(원). 이 종류의 조건(최소 주문 금액, 첫 주문 등)이 맞지 않으면 0. */
    int discount(Coupon coupon, Order order);
}
