package com.example.javatrack.j04;

import java.util.List;

/** 여러 할인 정책 중 가장 싼 가격을 고른다. 구현 클래스를 몰라도 DiscountPolicy만 알면 된다. */
public final class DiscountSelector {

    private DiscountSelector() {
    }

    /** 정책마다 apply한 가격 중 가장 작은 값. 정책이 없으면 price 그대로. */
    public static int bestPrice(int price, List<DiscountPolicy> policies) {
        int best = price;
        for (DiscountPolicy policy : policies) {
            // 선언 타입은 DiscountPolicy지만 실행되는 discount는 실제 객체(정률·정액·상한)의 것이다
            best = Math.min(best, policy.apply(price));
        }
        return best;
    }
}
