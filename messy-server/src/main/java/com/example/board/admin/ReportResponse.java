package com.example.board.admin;

import java.time.OffsetDateTime;
import java.time.ZoneId;

/** 글·신고자는 LAZY 연관이다. 트랜잭션 안에서(fetch join으로 읽은 뒤) 만들어야 한다. */
public record ReportResponse(Long id, Long postId, String postTitle, Long reporterId, String reporterNickname,
        ReportReason reason, String detail, ReportStatus status, OffsetDateTime createdAt) {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    static ReportResponse from(Report r) {
        return new ReportResponse(r.getId(), r.getPost().getId(), r.getPost().getTitle(), r.getReporter().getId(),
                r.getReporter().getNickname(), r.getReason(), r.getDetail(), r.getStatus(),
                r.getCreatedAt().atZone(KST).toOffsetDateTime());
    }
}
