package com.example.javatrack.j13;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * 쿠폰 할인 계산. (정답) 종류별 규칙은 {@link DiscountPolicy} 구현으로 옮기고, 이 클래스는 맞는 정책을 찾아 맡긴다.
 * <p>
 * 과제: 종류별 규칙을 {@link DiscountPolicy} 구현({@link FixedAmountPolicy}·{@link RatePolicy}·{@link FirstOrderPolicy})으로
 * 옮기고, {@link #discount}는 받은 정책 목록에서 쿠폰을 맡는 정책을 찾아 할인을 맡긴다. 할인액 규칙은 그대로다.
 * 인자 없는 생성자는 {@link #standardPolicies()}로 만든 계산기와 같다.
 */
public class DiscountCalculator {

    private final List<DiscountPolicy> policies;

    public DiscountCalculator() {
        this(standardPolicies());
    }

    public DiscountCalculator(List<DiscountPolicy> policies) {
        this.policies = List.copyOf(policies);
    }

    /** 종류마다 하나씩, 정액·정률·첫 주문 정책. */
    public static List<DiscountPolicy> standardPolicies() {
        // 쿠폰 종류를 더할 때 고치는 곳은 여기 한 줄과 새 구현 클래스뿐이다
        return List.of(new FixedAmountPolicy(), new RatePolicy(), new FirstOrderPolicy());
    }

    /** 쿠폰 하나로 이 주문에서 깎을 금액. 쿠폰이 없거나 모르는 종류면 0. */
    public int discount(Coupon coupon, Order order) {
        if (coupon == null) {
            return 0;
        }
        return policies.stream()
                .filter(policy -> policy.supports(coupon))
                .findFirst()
                .map(policy -> policy.discount(coupon, order))
                .orElse(0);
    }

    /** 가진 쿠폰 중 이 주문에서 할인액이 가장 큰 쿠폰. 할인액이 0인 쿠폰은 고르지 않는다. 같으면 앞의 쿠폰. */
    public Optional<Coupon> bestCoupon(List<Coupon> coupons, Order order) {
        // Stream.max는 같은 값이면 먼저 나온 원소를 남긴다
        return coupons.stream()
                .filter(coupon -> discount(coupon, order) > 0)
                .max(Comparator.comparingInt(coupon -> discount(coupon, order)));
    }
}
