package com.example.javatrack.j06;

import java.util.List;
import java.util.Optional;

/** 주어진 가짜 저장소: 고치지 않는다. Spring Data의 findById처럼 Optional을 돌려준다. */
public class CouponRepository {

    private final List<Coupon> coupons;

    public CouponRepository(List<Coupon> coupons) {
        this.coupons = List.copyOf(coupons);
    }

    public Optional<Coupon> findById(long id) {
        return coupons.stream().filter(coupon -> coupon.id() == id).findFirst();
    }
}
