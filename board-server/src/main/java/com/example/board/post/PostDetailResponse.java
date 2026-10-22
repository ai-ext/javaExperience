package com.example.board.post;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

/** 호출하는 쪽에서 member·postTags가 이미 로딩돼 있어야 한다(fetch join). */
public record PostDetailResponse(Long id, Long authorId, String authorNickname, String title, String content,
        List<String> tags, int likeCount, OffsetDateTime createdAt, OffsetDateTime updatedAt) {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public static PostDetailResponse from(Post post) {
        List<String> tags = post.getPostTags().stream().map(pt -> pt.getTag().getName()).toList();
        return new PostDetailResponse(post.getId(), post.getMember().getId(), post.getMember().getNickname(),
                post.getTitle(), post.getContent(), tags, post.getLikeCount(),
                post.getCreatedAt().atZone(KST).toOffsetDateTime(), post.getUpdatedAt().atZone(KST).toOffsetDateTime());
    }
}
