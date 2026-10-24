package com.example.board.notification;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record NotificationResponse(Long id, NotificationType type, String title, String body, Long refId,
        OffsetDateTime createdAt) {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getBody(), n.getRefId(),
                n.getCreatedAt().atZone(KST).toOffsetDateTime());
    }
}
