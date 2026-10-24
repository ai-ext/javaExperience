package com.example.javatrack.j04;

import java.util.List;

/** 여러 할인 정책 중 가장 싼 가격을 고른다. 구현 클래스를 몰라도 DiscountPolicy만 알면 된다. */
public final class DiscountSelector {

    private DiscountSelector() {
    }

    /** 정책마다 apply한 가격 중 가장 작은 값. 정책이 없으면 price 그대로. */
    public static int bestPrice(int price, List<DiscountPolicy> policies) {
        throw new UnsupportedOperationException("J04: DiscountSelector.bestPrice — 정책마다 apply한 값 중 최솟값을 고르세요");
    }
}
