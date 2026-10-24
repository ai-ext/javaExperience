package com.example.javatrack.j13;

/** "FIRST_ORDER" 쿠폰의 할인 규칙: 첫 주문. 첫 주문에서만 쿠폰 금액만큼, 주문 금액을 넘지 않게 깎는다. */
public class FirstOrderPolicy implements DiscountPolicy {

    @Override
    public boolean supports(Coupon coupon) {
        return "FIRST_ORDER".equals(coupon.type());
    }

    @Override
    public int discount(Coupon coupon, Order order) {
        if (!order.firstOrder()) {
            return 0;
        }
        return Math.min(coupon.value(), order.totalPrice());
    }
}
