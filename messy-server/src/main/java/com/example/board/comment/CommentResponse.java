package com.example.board.comment;

import java.time.OffsetDateTime;
import java.time.ZoneId;

/** 호출하는 쪽에서 member를 fetch join 해 둬야 한다. 안 그러면 댓글마다 쿼리가 나간다. */
public record CommentResponse(Long id, Long authorId, String authorNickname, String content,
        OffsetDateTime createdAt) {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public static CommentResponse from(Comment c) {
        return new CommentResponse(c.getId(), c.getMember().getId(), c.getMember().getNickname(), c.getContent(),
                c.getCreatedAt().atZone(KST).toOffsetDateTime());
    }
}
