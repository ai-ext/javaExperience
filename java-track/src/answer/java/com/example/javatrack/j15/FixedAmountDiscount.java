package com.example.javatrack.j15;

/**
 * 정액 할인: amount원을 뺀다. 가격이 amount보다 작으면 가격까지만 뺀다.
 * 가격이 minOrderPrice보다 작으면 {@link InvalidCouponException}.
 * 만들 때 amount가 1보다 작거나 minOrderPrice가 음수면 {@link IllegalArgumentException}.
 */
public class FixedAmountDiscount implements DiscountPolicy {

    private final long amount;
    private final long minOrderPrice;

    public FixedAmountDiscount(long amount, long minOrderPrice) {
        if (amount < 1 || minOrderPrice < 0) {
            throw new IllegalArgumentException("정액 할인 값이 잘못됐습니다: amount=" + amount + ", minOrderPrice=" + minOrderPrice);
        }
        this.amount = amount;
        this.minOrderPrice = minOrderPrice;
    }

    @Override
    public long discountOf(long price) {
        if (price < minOrderPrice) {
            throw new InvalidCouponException("최소 주문 금액 " + minOrderPrice + "원 미만입니다: " + price);
        }
        // 할인 뒤 가격이 음수가 되지 않게 가격까지만 뺀다
        return Math.min(amount, price);
    }
}
