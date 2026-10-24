package com.example.board.payment;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.example.board.common.BaseEntity;
import com.example.board.member.Member;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** PG 연계 로그. 호출 전에 REQUESTED로 먼저 남겨야 타임아웃 건도 흔적이 남는다. 상태 변경은 저장소의 조건부 UPDATE로만 한다. */
@Getter
@Entity
@Table(name = "pg_payment")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PgPayment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "order_id", nullable = false, length = 40)
    private String orderId;

    @Column(nullable = false)
    private int amount;

    @Column(name = "payment_key", length = 64)
    private String paymentKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PgPaymentStatus status;

    @Column(name = "idempotency_key", nullable = false, length = 64)
    private String idempotencyKey;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    private PgPayment(Member member, int amount, String idempotencyKey, LocalDateTime requestedAt) {
        this.member = member;
        // PG에 보내는 주문 번호는 서버가 만든다. 클라이언트 값을 그대로 쓰면 회원 간에 겹칠 수 있다.
        this.orderId = "CHG-" + UUID.randomUUID();
        this.amount = amount;
        this.status = PgPaymentStatus.REQUESTED;
        this.idempotencyKey = idempotencyKey;
        this.requestedAt = requestedAt;
    }

    public static PgPayment request(Member member, int amount, String idempotencyKey, LocalDateTime requestedAt) {
        return new PgPayment(member, amount, idempotencyKey, requestedAt);
    }
}
