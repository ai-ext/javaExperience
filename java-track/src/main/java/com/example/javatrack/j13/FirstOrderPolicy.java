package com.example.javatrack.j13;

/** "FIRST_ORDER" 쿠폰의 할인 규칙: 첫 주문. 첫 주문에서만 쿠폰 금액만큼, 주문 금액을 넘지 않게 깎는다. */
public class FirstOrderPolicy implements DiscountPolicy {

    @Override
    public boolean supports(Coupon coupon) {
        throw new UnsupportedOperationException("J13: FirstOrderPolicy.supports — \"FIRST_ORDER\" 쿠폰인지 보세요");
    }

    @Override
    public int discount(Coupon coupon, Order order) {
        throw new UnsupportedOperationException("J13: FirstOrderPolicy.discount — DiscountCalculator의 \"FIRST_ORDER\" 분기를 옮기세요");
    }
}
