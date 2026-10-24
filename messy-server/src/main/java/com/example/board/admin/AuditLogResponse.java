package com.example.board.admin;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record AuditLogResponse(Long id, Long actorId, String action, String targetType, Long targetId, String detail,
        OffsetDateTime createdAt) {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    static AuditLogResponse from(AuditLog a) {
        return new AuditLogResponse(a.getId(), a.getActorId(), a.getAction(), a.getTargetType(), a.getTargetId(),
                a.getDetail(), a.getCreatedAt().atZone(KST).toOffsetDateTime());
    }
}
