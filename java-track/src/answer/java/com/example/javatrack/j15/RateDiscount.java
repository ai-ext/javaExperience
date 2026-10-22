package com.example.javatrack.j15;

/**
 * 정률 할인: price × percent / 100을 뺀다. 원 단위 아래는 버리고(내림), maxDiscount를 넘지 않는다.
 * 만들 때 percent가 1~100이 아니거나 maxDiscount가 1보다 작으면 {@link IllegalArgumentException}.
 */
public class RateDiscount implements DiscountPolicy {

    private final int percent;
    private final long maxDiscount;

    public RateDiscount(int percent, long maxDiscount) {
        if (percent < 1 || percent > 100 || maxDiscount < 1) {
            throw new IllegalArgumentException("정률 할인 값이 잘못됐습니다: percent=" + percent + ", maxDiscount=" + maxDiscount);
        }
        this.percent = percent;
        this.maxDiscount = maxDiscount;
    }

    @Override
    public long discountOf(long price) {
        // long 정수 나눗셈은 소수점 아래를 버린다(9,999 × 10 / 100 = 999)
        return Math.min(price * percent / 100, maxDiscount);
    }
}
