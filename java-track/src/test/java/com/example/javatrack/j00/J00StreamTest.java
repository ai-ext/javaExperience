package com.example.javatrack.j00;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

/** 주제 과제: for 반복문을 stream으로 옮기기, 제네릭 타입(List<Post> → List<String>) 읽기. */
class J00StreamTest {

    private final List<Post> posts = List.of(
            new Post("자바 기초", 12),
            new Post("오늘 점심", 2),
            new Post("스프링 입문", 10),
            new Post("질문 있어요", 9));

    @Test
    void stream으로_옮긴_결과가_for로_쓴_원본과_같다() {
        List<String> withFor = PostStreams.popularTitlesWithFor(posts, 10);

        List<String> withStream = PostStreams.popularTitles(posts, 10);

        assertThat(withStream).containsExactly("자바 기초", "스프링 입문");
        assertThat(withStream).isEqualTo(withFor);
    }

    @Test
    void 조건에_맞는_글이_없으면_빈_리스트를_돌려준다() {
        List<String> titles = PostStreams.popularTitles(posts, 100);

        assertThat(titles).isNotNull().isEmpty();
    }
}
