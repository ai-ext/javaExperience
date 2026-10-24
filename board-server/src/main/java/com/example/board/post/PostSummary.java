package com.example.board.post;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

import lombok.Getter;

/** 목록 한 줄. 엔티티가 아니라 MyBatis resultMap이 필드에 직접 채우는 읽기 전용 모델이다. */
@Getter
public class PostSummary {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private Long id;
    private Long authorId;
    private String authorNickname;
    private String title;
    private List<String> tags;
    private int likeCount;
    private LocalDateTime createdAt;

    /** DB에는 KST 벽시계 시간이 저장된다. 상세 응답과 같은 오프셋 형식으로 내보낸다. */
    public OffsetDateTime getCreatedAt() {
        return createdAt.atZone(KST).toOffsetDateTime();
    }
}
