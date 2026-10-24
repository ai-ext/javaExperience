package com.example.board.coupon;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    /** 남은 수량이 있을 때만 1 올린다. 영향 행 수 0이면 소진(또는 없는 쿠폰)이다. 읽고 확인한 뒤 올리면 동시 발급에서 총량을 넘는다. */
    @Transactional
    @Modifying
    @Query("update Coupon c set c.issuedQuantity = c.issuedQuantity + 1 where c.id = :id and c.issuedQuantity < c.totalQuantity")
    int increaseIssued(@Param("id") Long id);
}
