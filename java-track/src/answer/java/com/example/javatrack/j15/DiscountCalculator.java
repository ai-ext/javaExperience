package com.example.javatrack.j15;

import java.util.ArrayList;
import java.util.List;

/**
 * 쿠폰 할인 계산기.
 * 생성자가 {@code CouponBook<? extends DiscountPolicy>}를 받으므로 {@code CouponBook<RateDiscount>}도,
 * {@code CouponBook<DiscountPolicy>}도 넣을 수 있다.
 */
public class DiscountCalculator {

    private final CouponBook<? extends DiscountPolicy> book;

    public DiscountCalculator(CouponBook<? extends DiscountPolicy> book) {
        this.book = book;
    }

    /**
     * 할인 뒤 가격. 쿠폰이 없으면(null) 가격 그대로.
     * 가격이 음수면 {@link IllegalArgumentException}, 없는 쿠폰 코드면 {@link InvalidCouponException}.
     * 쿠폰 조건 위반은 정책이 던지는 {@link InvalidCouponException}을 그대로 내보낸다.
     */
    public long priceAfterDiscount(Order order) {
        if (order.price() < 0) {
            throw new IllegalArgumentException("가격은 0 이상이어야 합니다: " + order.price());
        }
        if (order.couponCode() == null) {
            return order.price();
        }
        // ? extends DiscountPolicy에서 꺼낸 값은 DiscountPolicy로 읽을 수 있다
        DiscountPolicy policy = book.find(order.couponCode())
                .orElseThrow(() -> new InvalidCouponException("없는 쿠폰입니다: " + order.couponCode()));
        return order.price() - policy.discountOf(order.price());
    }

    /**
     * 주문 목록의 할인 전·후 합계(stream으로 계산한다).
     * 계산에 실패한 주문(위의 두 예외)이 있으면 합계 대신 실패한 주문을 모두 담은
     * {@link OrderCalculationException}을 던진다. 실패 사유는 예외 메시지다.
     */
    public OrderSummary summarize(List<Order> orders) {
        List<OrderFailure> failures = new ArrayList<>();
        for (Order order : orders) {
            try {
                priceAfterDiscount(order);
            } catch (InvalidCouponException | IllegalArgumentException e) {
                failures.add(new OrderFailure(order.orderId(), e.getMessage()));
            }
        }
        if (!failures.isEmpty()) {
            throw new OrderCalculationException(failures);
        }
        long before = orders.stream().mapToLong(Order::price).sum();
        long after = orders.stream().mapToLong(this::priceAfterDiscount).sum();
        return new OrderSummary(before, after);
    }
}
