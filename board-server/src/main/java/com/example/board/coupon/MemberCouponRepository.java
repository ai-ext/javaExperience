package com.example.board.coupon;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberCouponRepository extends JpaRepository<MemberCoupon, Long> {

    boolean existsByCouponIdAndMemberId(Long couponId, Long memberId);

    /** 쿠폰 이름·만료일을 한 번에 읽는다(N+1 방지). */
    @Query("select mc from MemberCoupon mc join fetch mc.coupon where mc.member.id = :memberId order by mc.id desc")
    List<MemberCoupon> findAllWithCoupon(@Param("memberId") Long memberId);
}
