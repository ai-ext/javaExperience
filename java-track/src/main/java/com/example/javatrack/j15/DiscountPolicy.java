package com.example.javatrack.j15;

/**
 * 주어진 인터페이스: 고치지 않는다.
 * 쿠폰 하나의 할인 규칙. 금액은 모두 원 단위 long이다.
 */
public interface DiscountPolicy {

    /**
     * price에서 뺄 할인액. 0 이상 price 이하다(할인 뒤 가격이 음수가 되지 않는다).
     * 쿠폰 조건(최소 주문 금액 등)에 맞지 않으면 {@link InvalidCouponException}을 던진다.
     */
    long discountOf(long price);
}
