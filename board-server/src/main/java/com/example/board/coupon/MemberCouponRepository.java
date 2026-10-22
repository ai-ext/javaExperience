package com.example.board.coupon;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface MemberCouponRepository extends JpaRepository<MemberCoupon, Long> {

    boolean existsByCouponIdAndMemberId(Long couponId, Long memberId);

    /** 쿠폰 이름·만료일을 한 번에 읽는다(N+1 방지). */
    @Query("select mc from MemberCoupon mc join fetch mc.coupon where mc.member.id = :memberId order by mc.id desc")
    List<MemberCoupon> findAllWithCoupon(@Param("memberId") Long memberId);

    /** 본인 소유·미사용·유효기간 내일 때만 사용 처리한다. 영향 행 수 0이면 쓸 수 없는 쿠폰이다. */
    @Transactional
    @Modifying
    @Query(nativeQuery = true, value = """
            UPDATE member_coupon mc JOIN coupon c ON c.id = mc.coupon_id
            SET mc.status = 'USED', mc.used_at = :now, mc.updated_at = :now
            WHERE mc.id = :id AND mc.member_id = :memberId AND mc.status = 'UNUSED' AND c.expires_at > :now
            """)
    int markUsed(@Param("id") Long id, @Param("memberId") Long memberId, @Param("now") LocalDateTime now);
}
