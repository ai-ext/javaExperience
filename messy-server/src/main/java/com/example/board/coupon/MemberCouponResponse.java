package com.example.board.coupon;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record MemberCouponResponse(Long id, Long couponId, String name, CouponStatus status,
        OffsetDateTime expiresAt, OffsetDateTime usedAt) {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** DB에는 KST 벽시계 시간이 저장된다. 다른 응답과 같은 오프셋 형식으로 내보낸다. */
    static MemberCouponResponse from(MemberCoupon mc) {
        return new MemberCouponResponse(mc.getId(), mc.getCoupon().getId(), mc.getCoupon().getName(), mc.getStatus(),
                mc.getCoupon().getExpiresAt().atZone(KST).toOffsetDateTime(),
                mc.getUsedAt() == null ? null : mc.getUsedAt().atZone(KST).toOffsetDateTime());
    }
}
