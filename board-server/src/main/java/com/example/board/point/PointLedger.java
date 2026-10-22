package com.example.board.point;

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

/** 추가만 하는 원장. 수정·삭제 메서드를 두지 않는다. */
@Getter
@Entity
@Table(name = "point_ledger")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointLedger extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PointLedgerType type;

    // 적립은 양수, 차감은 음수
    @Column(nullable = false)
    private long amount;

    @Column(name = "balance_after", nullable = false)
    private long balanceAfter;

    @Column(name = "ref_type", nullable = false, length = 30)
    private String refType;

    @Column(name = "ref_id")
    private Long refId;

    private PointLedger(Member member, PointLedgerType type, long amount, long balanceAfter, String refType,
            Long refId) {
        this.member = member;
        this.type = type;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.refType = refType;
        this.refId = refId;
    }

    public static PointLedger create(Member member, PointLedgerType type, long amount, long balanceAfter,
            String refType, Long refId) {
        return new PointLedger(member, type, amount, balanceAfter, refType, refId);
    }
}
