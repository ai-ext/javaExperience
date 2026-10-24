package com.example.javatrack.j13;

/** "RATE" 쿠폰의 할인 규칙: 정률. 주문 금액의 쿠폰 퍼센트를 10원 단위로 버리고, 최대 5000원까지 깎는다. */
public class RatePolicy implements DiscountPolicy {

    private static final int MAX_DISCOUNT = 5000;

    @Override
    public boolean supports(Coupon coupon) {
        return "RATE".equals(coupon.type());
    }

    @Override
    public int discount(Coupon coupon, Order order) {
        int raw = order.totalPrice() * coupon.value() / 100;
        // 10원 단위 버림
        return Math.min(raw / 10 * 10, MAX_DISCOUNT);
    }
}
