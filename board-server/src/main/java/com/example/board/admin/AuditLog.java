package com.example.board.admin;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.Immutable;

import com.example.board.common.BaseEntity;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 관리자 동작 기록. 추가 전용이라 바꾸는 메서드가 없고, @Immutable로 변경 감지 UPDATE도 막는다. */
@Getter
@Entity
@Immutable
@Table(name = "audit_log")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id", nullable = false, updatable = false)
    private Long actorId;

    @Column(nullable = false, length = 50, updatable = false)
    private String action;

    @Column(name = "target_type", nullable = false, length = 30, updatable = false)
    private String targetType;

    @Column(name = "target_id", updatable = false)
    private Long targetId;

    @Column(length = 500, updatable = false)
    private String detail;

    private AuditLog(Long actorId, String action, String targetType, Long targetId, String detail) {
        this.actorId = actorId;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.detail = detail;
    }

    public static AuditLog create(Long actorId, String action, String targetType, Long targetId, String detail) {
        return new AuditLog(actorId, action, targetType, targetId, detail);
    }
}
