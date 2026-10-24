package com.example.board.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.example.board.common.BaseEntity;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채널별 알림 한 건. 글·댓글과 같은 트랜잭션에 쌓아 두면(발송 대기열) 롤백된 글의 알림이 나가지 않는다.
 * 추가만 하고 수정하지 않는다.
 */
@Getter
@Entity
@Table(name = "notification")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationType type;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 1000)
    private String body;

    @Column(name = "ref_id")
    private Long refId;

    private Notification(Long memberId, NotificationChannel channel, NotificationType type, String title,
            String body, Long refId) {
        this.memberId = memberId;
        this.channel = channel;
        this.type = type;
        this.title = title;
        this.body = body;
        this.refId = refId;
    }

    public static Notification create(Long memberId, NotificationChannel channel, NotificationType type,
            String title, String body, Long refId) {
        return new Notification(memberId, channel, type, title, body, refId);
    }
}
