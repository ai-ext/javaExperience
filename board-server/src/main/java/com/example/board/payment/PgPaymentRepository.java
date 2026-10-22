package com.example.board.payment;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 상태 전이는 "현재 상태가 이것일 때만" 바꾸는 조건부 UPDATE다. 영향 행 수 1인 쪽만 후속 처리(적립)를 한다.
 * 승인 응답과 콜백이 동시에 와도 행 잠금으로 순서가 정해져 둘 중 하나만 1을 받는다.
 */
public interface PgPaymentRepository extends JpaRepository<PgPayment, Long> {

    Optional<PgPayment> findByIdempotencyKey(String idempotencyKey);

    Optional<PgPayment> findByOrderId(String orderId);

    @Modifying(clearAutomatically = true)
    @Query("update PgPayment p set p.status = com.example.board.payment.PgPaymentStatus.DONE,"
            + " p.paymentKey = :paymentKey, p.respondedAt = :now, p.updatedAt = :now"
            + " where p.id = :id and p.status in (com.example.board.payment.PgPaymentStatus.REQUESTED,"
            + " com.example.board.payment.PgPaymentStatus.UNKNOWN)")
    int markDone(@Param("id") Long id, @Param("paymentKey") String paymentKey, @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true)
    @Query("update PgPayment p set p.status = com.example.board.payment.PgPaymentStatus.FAILED,"
            + " p.paymentKey = coalesce(:paymentKey, p.paymentKey), p.respondedAt = :now, p.updatedAt = :now"
            + " where p.id = :id and p.status in (com.example.board.payment.PgPaymentStatus.REQUESTED,"
            + " com.example.board.payment.PgPaymentStatus.UNKNOWN)")
    int markFailed(@Param("id") Long id, @Param("paymentKey") String paymentKey, @Param("now") LocalDateTime now);

    /** REQUESTED에서만 UNKNOWN으로 간다. 콜백이 먼저 DONE으로 바꿨다면 그대로 둔다. */
    @Modifying(clearAutomatically = true)
    @Query("update PgPayment p set p.status = com.example.board.payment.PgPaymentStatus.UNKNOWN,"
            + " p.respondedAt = :now, p.updatedAt = :now"
            + " where p.id = :id and p.status = com.example.board.payment.PgPaymentStatus.REQUESTED")
    int markUnknown(@Param("id") Long id, @Param("now") LocalDateTime now);
}
