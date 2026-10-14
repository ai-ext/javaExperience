package org.example.querypractice;

import org.example.post.Post;

// 엔티티 전체를 JSON으로 노출하지 않고 이번 화면에 필요한 열만 반환한다.
public record QueryPostRow(Long id, String title, String boardSlug, Long authorId) {
    public static QueryPostRow of(Post post) {
        return new QueryPostRow(post.getId(), post.getTitle(), post.getBoard().getSlug(), post.getAuthor().getId());
    }
}
