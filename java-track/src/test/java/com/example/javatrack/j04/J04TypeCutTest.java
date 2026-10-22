package com.example.javatrack.j04;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * 타입 한 컷: == vs equals — 래퍼 캐시(-128~127) 때문에 작은 id는 ==도 맞아 보인다.
 * Java가 보장하는 것은 "-128~127은 같은 객체"뿐이다. 그 밖의 값이 같은 객체인지는 보장하지 않는다(캐시할 수도, 안 할 수도 있다).
 */
class J04TypeCutTest {

    @Test
    void Integer와_Long_오토박싱은_마이너스128부터_127까지_같은_객체임이_보장된다() {
        // 오토박싱은 Integer.valueOf·Long.valueOf를 쓰고, 이 범위는 미리 만들어 둔 객체를 돌려준다고 API가 약속한다
        Integer smallest1 = -128;
        Integer smallest2 = -128;
        Integer largest1 = 127;
        Integer largest2 = 127;
        Long id1 = 127L;
        Long id2 = 127L;

        assertThat(smallest1 == smallest2).isTrue();
        assertThat(largest1 == largest2).isTrue();
        assertThat(id1 == id2).isTrue();
    }

    @Test
    void 함정_작은_id는_캐시된_같은_객체라_참조_비교도_맞아_보인다() {
        Long writerId = 100L;
        Long memberId = 100L;

        assertThat(writerId == memberId).isTrue();
        assertThat(LeakyAuthorCheck.isWrittenBy(writerId, memberId)).isTrue();
        assertThat(AuthorCheck.isWrittenBy(writerId, memberId)).isTrue();
    }

    @Test
    @SuppressWarnings("removal") // new Long은 없어질 예정이지만, "값은 같고 객체는 다르다"를 확실히 만드는 방법이라 여기서만 쓴다
    void 함정_캐시_범위_밖은_같은_객체라는_보장이_없다_다른_객체면_참조_비교가_틀린다() {
        // 128 이상을 오토박싱하면 같은 객체일지 다른 객체일지 정해져 있지 않다(지금 JDK는 보통 다른 객체를 만든다).
        // 그래서 여기서는 new로 서로 다른 객체를 확실히 만들어, ==에 기대는 코드가 어떻게 틀리는지 본다
        Long writerId = new Long(128);
        Long memberId = new Long(128);

        assertThat(writerId == memberId).isFalse();
        // 개발 DB의 id가 작을 때는 통과하다가, 운영에서 id가 커지면 "작성자인데 403"이 날 수 있다
        assertThat(LeakyAuthorCheck.isWrittenBy(writerId, memberId)).isFalse();
        assertThat(AuthorCheck.isWrittenBy(writerId, memberId)).isTrue();
        // 오토박싱한 큰 값도 equals는 같은 객체인지와 상관없이 맞다
        assertThat(AuthorCheck.isWrittenBy(1_000_000L, 1_000_000L)).isTrue();
    }

    @Test
    void 다른_id거나_null이면_false다() {
        assertThat(AuthorCheck.isWrittenBy(1000L, 1001L)).isFalse();
        assertThat(AuthorCheck.isWrittenBy(null, 1L)).isFalse();
        assertThat(AuthorCheck.isWrittenBy(1L, null)).isFalse();
    }
}
