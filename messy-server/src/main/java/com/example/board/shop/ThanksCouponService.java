package com.example.board.shop;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.coupon.CouponService;
import com.example.board.coupon.MemberCouponRepository;

/**
 * 구매 감사 쿠폰(선착순 이벤트). 구매할 때마다 이벤트 쿠폰을 한 장씩, 1인 1매로 준다.
 * 이벤트 쿠폰 id는 board.shop.thanks-coupon-id로 켠다. 0이면 이벤트가 없는 것이다.
 */
@Service
public class ThanksCouponService {

    private static final Logger log = LoggerFactory.getLogger(ThanksCouponService.class);

    private final CouponService couponService;
    private final MemberCouponRepository memberCouponRepository;
    private final long thanksCouponId;

    public ThanksCouponService(CouponService couponService, MemberCouponRepository memberCouponRepository,
            @Value("${board.shop.thanks-coupon-id:0}") long thanksCouponId) {
        this.couponService = couponService;
        this.memberCouponRepository = memberCouponRepository;
        this.thanksCouponId = thanksCouponId;
    }

    /** 받았는지 확인과 지급을 한 트랜잭션에서 한다. */
    @Transactional
    public void giveAfterPurchase(Long memberId) {
        if (thanksCouponId <= 0 || memberCouponRepository.existsByCouponIdAndMemberId(thanksCouponId, memberId)) {
            return;
        }
        try {
            couponService.grant(thanksCouponId, memberId);
        } catch (BusinessException e) {
            // 선착순이라 떨어지는 것이 정상이다. 쿠폰을 못 받아도 구매는 성공해야 하므로 기록만 남기고 넘어간다.
            log.info("구매 감사 쿠폰 미지급 memberId={} 사유={}", memberId, e.getMessage());
        }
    }
}
