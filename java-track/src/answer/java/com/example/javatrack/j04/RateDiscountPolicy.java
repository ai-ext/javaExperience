package com.example.javatrack.j04;

/** 정률 할인. 가격의 ratePercent%를 깎는다. 원 단위 아래는 버린다(정수 나눗셈). */
public class RateDiscountPolicy implements DiscountPolicy {

    private final int ratePercent;

    /** ratePercent가 0~100이 아니면 IllegalArgumentException. */
    public RateDiscountPolicy(int ratePercent) {
        if (ratePercent < 0 || ratePercent > 100) {
            throw new IllegalArgumentException("할인율은 0~100이어야 합니다: " + ratePercent);
        }
        this.ratePercent = ratePercent;
    }

    @Override
    public int discount(int price) {
        // 곱하기를 먼저 해야 한다. 999원 10%를 price / 100 * rate로 하면 99가 아니라 90이 된다.
        // 곱하기는 long으로 한다. int끼리 곱하면 3천만 원 × 100에서 int 범위를 넘어 음수가 된다.
        // 결과는 price 이하라 int로 돌려도 넘치지 않는다
        return (int) ((long) price * ratePercent / 100);
    }

    /** 예: "정률 10%" */
    @Override
    public String name() {
        return "정률 " + ratePercent + "%";
    }
}
