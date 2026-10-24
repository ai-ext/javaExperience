package com.example.javatrack.j15;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 쿠폰 코드 → 할인 정책. P로 담을 수 있는 정책 타입을 정한다
 * ({@code CouponBook<RateDiscount>}는 정률 쿠폰만 받고, 꺼낼 때 형변환이 필요 없다).
 */
public class CouponBook<P extends DiscountPolicy> {

    private final Map<String, P> policies = new HashMap<>();

    /** 코드를 등록한다. 이미 있는 코드면 {@link IllegalArgumentException}. */
    public void register(String code, P policy) {
        // putIfAbsent는 이미 있으면 기존 값을 돌려주고 바꾸지 않는다
        if (policies.putIfAbsent(code, policy) != null) {
            throw new IllegalArgumentException("이미 등록된 쿠폰 코드입니다: " + code);
        }
    }

    /** 코드에 맞는 정책. 없으면 빈 Optional. */
    public Optional<P> find(String code) {
        return Optional.ofNullable(policies.get(code));
    }
}
