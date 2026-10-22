package com.example.javatrack.j01;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 실무 습관: 불변 컬렉션과 방어적 복사 — 참조 복사의 실전판. */
class J01HabitTest {

    @Test
    void getter가_내부_리스트를_내주면_밖에서_글이_바뀐다_Post는_막는다() {
        LeakyPost leaky = new LeakyPost("함정 글", new ArrayList<>(List.of("java")));
        leaky.getTags().add("광고");
        // 글을 거치지 않고 태그가 바뀌었다
        assertThat(leaky.getTags()).containsExactly("java", "광고");

        Post post = new Post("자바 글", List.of("java"));
        List<String> tags = post.getTags();

        assertThatThrownBy(() -> tags.add("광고"))
                .isInstanceOf(UnsupportedOperationException.class);
        assertThat(post.getTags()).containsExactly("java");
    }

    @Test
    void 생성자에_넘긴_리스트를_밖에서_바꿔도_글의_태그는_그대로다() {
        List<String> source = new ArrayList<>(List.of("java"));
        LeakyPost leaky = new LeakyPost("함정 글", source);
        Post post = new Post("자바 글", source);

        source.add("광고");

        // LeakyPost는 받은 리스트를 그대로 가지고 있어 같이 바뀐다
        assertThat(leaky.getTags()).containsExactly("java", "광고");
        assertThat(post.getTags()).containsExactly("java");
    }

    @Test
    void List_of를_넘겨도_addTag가_된다() {
        // List.of로 만든 리스트는 불변이라 add하면 예외가 난다. 받은 리스트를 그대로 쓰면 이렇게 터진다
        LeakyPost leaky = new LeakyPost("함정 글", List.of());
        assertThatThrownBy(() -> leaky.addTag("java"))
                .isInstanceOf(UnsupportedOperationException.class);

        Post post = new Post("자바 글", List.of());
        post.addTag("java");

        assertThat(post.getTags()).containsExactly("java");
    }

    @Test
    void 태그는_addTag로만_바뀐다() {
        Post post = new Post("자바 글", List.of("java"));

        post.addTag("spring");

        assertThat(post.getTitle()).isEqualTo("자바 글");
        assertThat(post.getTags()).containsExactly("java", "spring");
    }
}
