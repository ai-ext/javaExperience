package com.example.javatrack.j05;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 작성자별 좋아요 합계(groupingBy). */
class J05BasicsTest {

    @Test
    void 작성자별로_좋아요를_더한다() {
        List<Post> posts = List.of(
                new Post(1L, "첫 글", "자바초보", 3, PostStatus.ACTIVE, List.of()),
                new Post(2L, "둘째 글", "스프링입문", 5, PostStatus.ACTIVE, List.of()),
                new Post(3L, "셋째 글", "자바초보", 4, PostStatus.ACTIVE, List.of()));

        Map<String, Integer> likes = PostStats.likesByAuthor(posts);

        assertThat(likes).containsOnly(Map.entry("자바초보", 7), Map.entry("스프링입문", 5));
    }

    @Test
    void 글이_없으면_빈_Map이다() {
        assertThat(PostStats.likesByAuthor(List.of())).isEmpty();
    }
}
