package com.example.javatrack.j04;

/** 정률 할인. 가격의 ratePercent%를 깎는다. 원 단위 아래는 버린다(정수 나눗셈). */
public class RateDiscountPolicy implements DiscountPolicy {

    // TODO: 할인율 필드를 선언하세요

    /** ratePercent가 0~100이 아니면 IllegalArgumentException. */
    public RateDiscountPolicy(int ratePercent) {
        throw new UnsupportedOperationException("J04: RateDiscountPolicy 생성자 — 0~100인지 검사하고 담으세요");
    }

    @Override
    public int discount(int price) {
        throw new UnsupportedOperationException("J04: RateDiscountPolicy.discount — price * 할인율 / 100");
    }

    /** 예: "정률 10%" */
    @Override
    public String name() {
        throw new UnsupportedOperationException("J04: RateDiscountPolicy.name — \"정률 \" + 할인율 + \"%\"");
    }
}
