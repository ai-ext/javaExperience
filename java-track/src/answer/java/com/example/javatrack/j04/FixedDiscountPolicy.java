package com.example.javatrack.j04;

/** 정액 할인. amount원을 깎되 가격보다 많이 깎지 않는다. */
public class FixedDiscountPolicy implements DiscountPolicy {

    private final int amount;

    /** amount가 음수면 IllegalArgumentException. */
    public FixedDiscountPolicy(int amount) {
        if (amount < 0) {
            throw new IllegalArgumentException("할인액은 0 이상이어야 합니다: " + amount);
        }
        this.amount = amount;
    }

    @Override
    public int discount(int price) {
        return Math.min(amount, price);
    }

    /** 예: "정액 3000원" */
    @Override
    public String name() {
        return "정액 " + amount + "원";
    }
}
