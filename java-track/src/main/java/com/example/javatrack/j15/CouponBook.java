package com.example.javatrack.j15;

import java.util.Optional;

/**
 * 쿠폰 코드 → 할인 정책. P로 담을 수 있는 정책 타입을 정한다
 * ({@code CouponBook<RateDiscount>}는 정률 쿠폰만 받고, 꺼낼 때 형변환이 필요 없다).
 */
public class CouponBook<P extends DiscountPolicy> {

    // TODO: 코드별 정책을 담을 필드를 선언하세요

    /** 코드를 등록한다. 이미 있는 코드면 {@link IllegalArgumentException}. */
    public void register(String code, P policy) {
        throw new UnsupportedOperationException("J15: CouponBook.register — 중복 코드를 거절하고 담으세요");
    }

    /** 코드에 맞는 정책. 없으면 빈 Optional. */
    public Optional<P> find(String code) {
        throw new UnsupportedOperationException("J15: CouponBook.find — 없으면 빈 Optional을 돌려주세요");
    }
}
