package com.example.javatrack.j04;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** 타입 한 컷: == vs equals — Long 캐시(-128~127) 때문에 작은 id는 ==도 맞아 보인다. */
class J04TypeCutTest {

    @Test
    void 함정_작은_id는_캐시된_같은_객체라_참조_비교도_맞아_보인다() {
        Long writerId = 100L;
        Long memberId = 100L;

        // 오토박싱은 Long.valueOf를 쓰고, -128~127은 미리 만들어 둔 같은 객체를 돌려준다
        assertThat(writerId == memberId).isTrue();
        assertThat(LeakyAuthorCheck.isWrittenBy(writerId, memberId)).isTrue();
        assertThat(AuthorCheck.isWrittenBy(writerId, memberId)).isTrue();
    }

    @Test
    void 함정_128부터는_값이_같아도_다른_객체라_참조_비교가_틀린다() {
        Long writerId = 128L;
        Long memberId = 128L;

        assertThat(writerId == memberId).isFalse();
        // 개발 DB의 id가 작을 때는 통과하다가, 운영에서 id가 128을 넘으면 "작성자인데 403"이 난다
        assertThat(LeakyAuthorCheck.isWrittenBy(writerId, memberId)).isFalse();
        assertThat(AuthorCheck.isWrittenBy(writerId, memberId)).isTrue();
        assertThat(AuthorCheck.isWrittenBy(Long.valueOf(1_000_000), Long.valueOf(1_000_000))).isTrue();
    }

    @Test
    void 다른_id거나_null이면_false다() {
        assertThat(AuthorCheck.isWrittenBy(1000L, 1001L)).isFalse();
        assertThat(AuthorCheck.isWrittenBy(null, 1L)).isFalse();
        assertThat(AuthorCheck.isWrittenBy(1L, null)).isFalse();
    }
}
