package com.example.javatrack.j15;

import java.util.List;

/**
 * 쿠폰 할인 계산기.
 * 생성자가 {@code CouponBook<? extends DiscountPolicy>}를 받으므로 {@code CouponBook<RateDiscount>}도,
 * {@code CouponBook<DiscountPolicy>}도 넣을 수 있다.
 */
public class DiscountCalculator {

    // TODO: 쿠폰북 필드를 선언하세요

    public DiscountCalculator(CouponBook<? extends DiscountPolicy> book) {
        throw new UnsupportedOperationException("J15: DiscountCalculator 생성자 — 쿠폰북을 필드에 담으세요");
    }

    /**
     * 할인 뒤 가격. 쿠폰이 없으면(null) 가격 그대로.
     * 가격이 음수면 {@link IllegalArgumentException}, 없는 쿠폰 코드면 {@link InvalidCouponException}.
     * 쿠폰 조건 위반은 정책이 던지는 {@link InvalidCouponException}을 그대로 내보낸다.
     */
    public long priceAfterDiscount(Order order) {
        throw new UnsupportedOperationException("J15: DiscountCalculator.priceAfterDiscount — 쿠폰을 찾아 할인을 빼세요");
    }

    /**
     * 주문 목록의 할인 전·후 합계(stream으로 계산한다).
     * 계산에 실패한 주문(위의 두 예외)이 있으면 합계 대신 실패한 주문을 모두 담은
     * {@link OrderCalculationException}을 던진다. 실패 사유는 예외 메시지다.
     */
    public OrderSummary summarize(List<Order> orders) {
        throw new UnsupportedOperationException("J15: DiscountCalculator.summarize — 실패를 모아 던지고, 아니면 stream으로 합계를 내세요");
    }
}
