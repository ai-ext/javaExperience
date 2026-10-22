package com.example.javatrack.j00;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** 기본기: 값 전달 세 가지. 기본형은 값이, 객체는 참조가 복사된다. */
class J00ValuePassingTest {

    @Test
    void 메서드_안에서_int를_바꿔도_호출한_쪽은_그대로다() {
        int likeCount = 3;

        int inside = ValuePassing.likeInside(likeCount);

        assertThat(inside).isEqualTo(4);
        assertThat(likeCount).isEqualTo(3);
    }

    @Test
    void 메서드_안에서_객체_필드를_바꾸면_호출한_쪽도_바뀐다() {
        Post post = new Post("첫 글", 0);

        ValuePassing.likeTwice(post);

        assertThat(post.getLikeCount()).isEqualTo(2);
    }

    @Test
    void 매개변수에_새_객체를_대입하면_호출한_쪽은_그대로다() {
        Post original = new Post("원래 제목", 3);

        Post inside = ValuePassing.replaceInside(original, "새 제목");

        assertThat(inside.getTitle()).isEqualTo("새 제목");
        assertThat(inside).isNotSameAs(original);
        assertThat(original.getTitle()).isEqualTo("원래 제목");
        assertThat(original.getLikeCount()).isEqualTo(3);
    }
}
