package com.example.javatrack.j15;

/**
 * 정액 할인: amount원을 뺀다. 가격이 amount보다 작으면 가격까지만 뺀다.
 * 가격이 minOrderPrice보다 작으면 {@link InvalidCouponException}.
 * 만들 때 amount가 1보다 작거나 minOrderPrice가 음수면 {@link IllegalArgumentException}.
 */
public class FixedAmountDiscount implements DiscountPolicy {

    // TODO: 필드를 선언하세요

    public FixedAmountDiscount(long amount, long minOrderPrice) {
        throw new UnsupportedOperationException("J15: FixedAmountDiscount 생성자 — 값을 검사하고 필드에 담으세요");
    }

    @Override
    public long discountOf(long price) {
        throw new UnsupportedOperationException("J15: FixedAmountDiscount.discountOf — 최소 주문 금액을 확인하고 정액을 빼세요(가격까지만)");
    }
}
