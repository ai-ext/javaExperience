package com.example.board.post;

import java.time.OffsetDateTime;
import java.util.List;

/** 인기글 한 줄. PostSummary는 생성자가 없어 JSON으로 되읽을 수 없으므로 캐시에는 이 record를 넣는다. */
public record PopularPost(Long id, Long authorId, String authorNickname, String title, List<String> tags,
        int likeCount, OffsetDateTime createdAt) {

    static PopularPost from(PostSummary s) {
        return new PopularPost(s.getId(), s.getAuthorId(), s.getAuthorNickname(), s.getTitle(), s.getTags(),
                s.getLikeCount(), s.getCreatedAt());
    }
}
