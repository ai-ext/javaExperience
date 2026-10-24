package com.example.javatrack.j13;

import java.util.List;
import java.util.Optional;

/**
 * 쿠폰 할인 계산. 지금은 {@link #discount}가 쿠폰 종류를 if-else로 가른다.
 * <p>
 * 과제: 종류별 규칙을 {@link DiscountPolicy} 구현({@link FixedAmountPolicy}·{@link RatePolicy}·{@link FirstOrderPolicy})으로
 * 옮기고, {@link #discount}는 받은 정책 목록에서 쿠폰을 맡는 정책을 찾아 할인을 맡긴다. 할인액 규칙은 그대로다.
 * 인자 없는 생성자는 {@link #standardPolicies()}로 만든 계산기와 같다.
 */
public class DiscountCalculator {

    // TODO: 정책 목록 필드를 선언하세요

    public DiscountCalculator() {
        // 레거시는 들고 있는 것이 없다. 정책 목록 생성자를 만든 뒤에는 this(standardPolicies())로 바꾸세요
    }

    public DiscountCalculator(List<DiscountPolicy> policies) {
        throw new UnsupportedOperationException("J13: DiscountCalculator 생성자 — 받은 정책 목록을 필드에 담으세요");
    }

    /** 종류마다 하나씩, 정액·정률·첫 주문 정책. */
    public static List<DiscountPolicy> standardPolicies() {
        throw new UnsupportedOperationException("J13: DiscountCalculator.standardPolicies — 정책 구현 3개를 담은 목록을 돌려주세요");
    }

    /** 쿠폰 하나로 이 주문에서 깎을 금액. 쿠폰이 없거나 모르는 종류면 0. */
    public int discount(Coupon coupon, Order order) {
        if (coupon == null) {
            return 0;
        }
        if ("FIXED".equals(coupon.type())) {
            // 정액: 1만 원 이상 주문에서만, 주문 금액을 넘지 않게
            if (order.totalPrice() < 10000) {
                return 0;
            }
            return Math.min(coupon.value(), order.totalPrice());
        } else if ("RATE".equals(coupon.type())) {
            // 정률: 10원 단위 버림, 최대 5000원
            int d = order.totalPrice() * coupon.value() / 100;
            d = d / 10 * 10;
            if (d > 5000) {
                d = 5000;
            }
            return d;
        } else if ("FIRST_ORDER".equals(coupon.type())) {
            // 첫 주문: 첫 주문에서만, 주문 금액을 넘지 않게
            if (!order.firstOrder()) {
                return 0;
            }
            return Math.min(coupon.value(), order.totalPrice());
        } else {
            return 0;
        }
    }

    /** 가진 쿠폰 중 이 주문에서 할인액이 가장 큰 쿠폰. 할인액이 0인 쿠폰은 고르지 않는다. 같으면 앞의 쿠폰. */
    public Optional<Coupon> bestCoupon(List<Coupon> coupons, Order order) {
        throw new UnsupportedOperationException("J13: DiscountCalculator.bestCoupon — stream으로 할인액이 0보다 큰 쿠폰 중 가장 큰 것을 고르세요(같으면 앞의 쿠폰이 남게 규칙을 직접 쓰세요)");
    }
}
