package com.example.javatrack.j05;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** 회원이 받은 쿠폰에서 고르기. */
public final class CouponFinder {

    private CouponFinder() {
    }

    /** 사용 가능한 쿠폰: 미사용(UNUSED)이고, today가 만료일을 지나지 않았고(당일은 가능), orderAmount가 최소 주문 금액 이상. 받은 순서 유지. */
    public static List<MemberCoupon> usable(List<MemberCoupon> coupons, int orderAmount, LocalDate today) {
        return coupons.stream()
                .filter(coupon -> coupon.status() == CouponStatus.UNUSED)
                // "만료일이 오늘 이후"(isAfter)로 쓰면 당일 쿠폰이 빠진다. "오늘이 만료일을 지나지 않았다"로 쓴다
                .filter(coupon -> !today.isAfter(coupon.expiresOn()))
                .filter(coupon -> orderAmount >= coupon.minOrderAmount())
                .toList();
    }

    /** id가 같은 쿠폰. 없으면 빈 Optional(null을 돌려주지 않는다). */
    public static Optional<MemberCoupon> findById(List<MemberCoupon> coupons, long id) {
        return coupons.stream()
                .filter(coupon -> coupon.id() == id)
                .findFirst();
    }

    /** 받은 리스트에서 사용한(USED) 쿠폰을 지운다. 리스트 자체를 바꾼다. */
    public static void removeUsed(List<MemberCoupon> coupons) {
        // 향상된 for 안에서 remove하면 다음 차례에 ConcurrentModificationException. removeIf는 안에서 안전하게 지운다
        coupons.removeIf(coupon -> coupon.status() == CouponStatus.USED);
    }
}
