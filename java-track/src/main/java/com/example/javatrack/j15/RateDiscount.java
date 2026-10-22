package com.example.javatrack.j15;

/**
 * 정률 할인: price × percent / 100을 뺀다. 원 단위 아래는 버리고(내림), maxDiscount를 넘지 않는다.
 * 만들 때 percent가 1~100이 아니거나 maxDiscount가 1보다 작으면 {@link IllegalArgumentException}.
 */
public class RateDiscount implements DiscountPolicy {

    // TODO: 필드를 선언하세요

    public RateDiscount(int percent, long maxDiscount) {
        throw new UnsupportedOperationException("J15: RateDiscount 생성자 — 값을 검사하고 필드에 담으세요");
    }

    @Override
    public long discountOf(long price) {
        throw new UnsupportedOperationException("J15: RateDiscount.discountOf — 비율로 계산해 내림하고 상한을 넘지 않게 하세요");
    }
}
