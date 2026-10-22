package com.example.javatrack.j06;

import java.util.Optional;

/** 타입 한 컷: Optional — orElse와 orElseGet, orElseThrow, 반환 타입에만 쓰기. */
public class CouponLookup {

    private final CouponRepository repository;
    private final DefaultCouponFactory factory;

    public CouponLookup(CouponRepository repository, DefaultCouponFactory factory) {
        this.repository = repository;
        this.factory = factory;
    }

    /** 있으면 그 쿠폰, 없으면 기본 쿠폰. 기본 쿠폰은 없을 때만 만든다(있으면 factory를 부르지 않는다). */
    public Coupon findOrDefault(long id) {
        // orElseGet은 "만드는 방법"을 받는다. 값이 없을 때만 그 방법을 실행한다
        return repository.findById(id).orElseGet(factory::create);
    }

    /** 있으면 그 쿠폰, 없으면 NotFoundException("쿠폰", id). */
    public Coupon getOrThrow(long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("쿠폰", id));
    }

    /** 검색어 정리. 매개변수는 그냥 String(null 가능)으로 받고, 결과를 Optional로 돌려준다. null·공백이면 빈 Optional, 아니면 strip한 값. */
    public static Optional<String> normalizeKeyword(String keyword) {
        return Optional.ofNullable(keyword)
                .map(String::strip)
                .filter(stripped -> !stripped.isEmpty());
    }
}
