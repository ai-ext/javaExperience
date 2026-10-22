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
        // price × percent를 먼저 곱하면 아주 큰 price에서 long이 넘친다. 100으로 나눈 몫과 나머지로 나눠 계산한다:
        // price × percent / 100 = (price / 100) × percent + (price % 100) × percent / 100
        // 앞 항은 price 이하라 넘치지 않고, 뒤 항은 99 × 100 이하다. 정수 나눗셈이라 원 단위 아래는 버린다(9,999 → 999)
        long discount = price / 100 * percent + price % 100 * percent / 100;
        return Math.min(discount, maxDiscount);
    }
}
