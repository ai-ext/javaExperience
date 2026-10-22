package com.example.javatrack.j13;

/** "RATE" 쿠폰의 할인 규칙: 정률. 주문 금액의 쿠폰 퍼센트를 10원 단위로 버리고, 최대 5000원까지 깎는다. */
public class RatePolicy implements DiscountPolicy {

    @Override
    public boolean supports(Coupon coupon) {
        throw new UnsupportedOperationException("J13: RatePolicy.supports — \"RATE\" 쿠폰인지 보세요");
    }

    @Override
    public int discount(Coupon coupon, Order order) {
        throw new UnsupportedOperationException("J13: RatePolicy.discount — DiscountCalculator의 \"RATE\" 분기를 옮기세요");
    }
}
