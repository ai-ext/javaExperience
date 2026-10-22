package com.example.javatrack.j04;

/** 정액 할인. amount원을 깎되 가격보다 많이 깎지 않는다. */
public class FixedDiscountPolicy implements DiscountPolicy {

    // TODO: 할인액 필드를 선언하세요

    /** amount가 음수면 IllegalArgumentException. */
    public FixedDiscountPolicy(int amount) {
        throw new UnsupportedOperationException("J04: FixedDiscountPolicy 생성자 — 0 이상인지 검사하고 담으세요");
    }

    @Override
    public int discount(int price) {
        throw new UnsupportedOperationException("J04: FixedDiscountPolicy.discount — amount와 price 중 작은 값");
    }

    /** 예: "정액 3000원" */
    @Override
    public String name() {
        throw new UnsupportedOperationException("J04: FixedDiscountPolicy.name — \"정액 \" + 할인액 + \"원\"");
    }
}
