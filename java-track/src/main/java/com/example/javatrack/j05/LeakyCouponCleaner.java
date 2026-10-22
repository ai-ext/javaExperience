package com.example.javatrack.j05;

import java.util.List;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link CouponFinder#removeUsed}와 비교하려고 둔다.
 * 향상된 for로 돌면서 같은 리스트에서 remove한다.
 */
public final class LeakyCouponCleaner {

    private LeakyCouponCleaner() {
    }

    public static void removeUsed(List<MemberCoupon> coupons) {
        for (MemberCoupon coupon : coupons) {
            if (coupon.status() == CouponStatus.USED) {
                coupons.remove(coupon);
            }
        }
    }
}
