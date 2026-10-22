package com.example.board.coupon;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.MemberRepository;

/** issue에는 @Transactional을 두지 않는다. 트랜잭션 경계를 안쪽(TransactionTemplate)에 두고 UNIQUE 위반을 바깥에서 잡기 위해서다. */
@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final MemberRepository memberRepository;
    private final TransactionTemplate tx;

    public CouponService(CouponRepository couponRepository, MemberCouponRepository memberCouponRepository,
            MemberRepository memberRepository, TransactionTemplate tx) {
        this.couponRepository = couponRepository;
        this.memberCouponRepository = memberCouponRepository;
        this.memberRepository = memberRepository;
        this.tx = tx;
    }

    /** 1인 1매, 선착순. 발급된 member_coupon의 id를 돌려준다. */
    public Long issue(Long couponId, Long memberId) {
        try {
            return tx.execute(s -> {
                if (memberCouponRepository.existsByCouponIdAndMemberId(couponId, memberId)) {
                    throw duplicate();
                }
                if (couponRepository.increaseIssued(couponId) == 0) {
                    if (!couponRepository.existsById(couponId)) {
                        throw new BusinessException(ErrorCode.NOT_FOUND, "쿠폰을 찾을 수 없습니다.");
                    }
                    throw new BusinessException(ErrorCode.COUPON_EXHAUSTED, "쿠폰이 모두 소진되었습니다.");
                }
                return memberCouponRepository.saveAndFlush(MemberCoupon.create(
                        couponRepository.getReferenceById(couponId), memberRepository.getReferenceById(memberId)))
                        .getId();
            });
        } catch (DataIntegrityViolationException duplicate) {
            // UNIQUE(coupon_id, member_id) 위반 = 동시 요청이 먼저 받았다. 수량 증가도 함께 롤백됐다.
            throw duplicate();
        }
    }

    @Transactional(readOnly = true)
    public List<MemberCouponResponse> myCoupons(Long memberId) {
        return memberCouponRepository.findAllWithCoupon(memberId).stream().map(MemberCouponResponse::from).toList();
    }

    private static BusinessException duplicate() {
        return new BusinessException(ErrorCode.DUPLICATE, "이미 받은 쿠폰입니다.");
    }
}
