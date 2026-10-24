package com.example.javatrack.j13;

/** "FIXED" 쿠폰의 할인 규칙: 정액. 1만 원 이상 주문에서만 쿠폰 금액만큼, 주문 금액을 넘지 않게 깎는다. */
public class FixedAmountPolicy implements DiscountPolicy {

    @Override
    public boolean supports(Coupon coupon) {
        throw new UnsupportedOperationException("J13: FixedAmountPolicy.supports — \"FIXED\" 쿠폰인지 보세요");
    }

    @Override
    public int discount(Coupon coupon, Order order) {
        throw new UnsupportedOperationException("J13: FixedAmountPolicy.discount — DiscountCalculator의 \"FIXED\" 분기를 옮기세요");
    }
}
