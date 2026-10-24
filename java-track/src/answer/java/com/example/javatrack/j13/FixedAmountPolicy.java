package com.example.javatrack.j13;

/** "FIXED" 쿠폰의 할인 규칙: 정액. 1만 원 이상 주문에서만 쿠폰 금액만큼, 주문 금액을 넘지 않게 깎는다. */
public class FixedAmountPolicy implements DiscountPolicy {

    private static final int MIN_ORDER_PRICE = 10000;

    @Override
    public boolean supports(Coupon coupon) {
        return "FIXED".equals(coupon.type());
    }

    @Override
    public int discount(Coupon coupon, Order order) {
        if (order.totalPrice() < MIN_ORDER_PRICE) {
            return 0;
        }
        return Math.min(coupon.value(), order.totalPrice());
    }
}
