package com.example.board.post;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

/** 호출하는 쪽에서 트랜잭션 안에 있어야 tags(지연 로딩)를 읽을 수 있다. */
public record PostResponse(Long id, Long authorId, String title, String content, List<String> tags, int likeCount,
        OffsetDateTime createdAt) {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public static PostResponse from(Post post) {
        List<String> tags = post.getPostTags().stream().map(pt -> pt.getTag().getName()).toList();
        return new PostResponse(post.getId(), post.getMember().getId(), post.getTitle(), post.getContent(), tags,
                post.getLikeCount(), post.getCreatedAt().atZone(KST).toOffsetDateTime());
    }
}
