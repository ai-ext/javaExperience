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
        // 곱하기를 먼저 해야 한다. price / 100 * rate는 999원에서 0이 된다
        return price * ratePercent / 100;
    }

    /** 예: "정률 10%" */
    @Override
    public String name() {
        return "정률 " + ratePercent + "%";
    }
}
