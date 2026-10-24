package com.example.board.member;

import java.time.OffsetDateTime;
import java.time.ZoneId;

/** 엔티티를 그대로 내보내면 passwordHash가 실리므로 응답 전용 DTO를 쓴다. */
public record MemberResponse(Long id, String email, String nickname, Role role, OffsetDateTime createdAt) {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public static MemberResponse from(Member member) {
        // 저장은 KST 기준 LocalDateTime이라 오프셋을 붙여 ISO-8601로 내보낸다
        return new MemberResponse(member.getId(), member.getEmail(), member.getNickname(), member.getRole(),
                member.getCreatedAt().atZone(KST).toOffsetDateTime());
    }
}
