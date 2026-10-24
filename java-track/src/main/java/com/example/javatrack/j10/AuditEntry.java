package com.example.javatrack.j10;

/**
 * 주어진 record: 고치지 않는다.
 * 감사 로그 한 줄. action이 생기기 전에 쌓인 옛 기록은 action이 null이다.
 */
public record AuditEntry(Long actorId, String action, String targetType, Long targetId) {
}
