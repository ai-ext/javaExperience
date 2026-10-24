package com.example.javatrack.j02;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** 타입 한 컷: long vs Long — 엔티티 id가 Long인 이유(null이면 저장 전), 저장소의 신규·기존 판단. */
class J02TypeCutTest {

    @Test
    void 새로_만든_글은_id가_null이고_새_엔티티다() {
        Post post = new Post("첫 글");

        assertThat(post.getId()).isNull();
        assertThat(post.isNew()).isTrue();
    }

    @Test
    void 저장하면_id가_1부터_매겨지고_새_엔티티가_아니게_된다() {
        PostRepository repository = new PostRepository();

        Post first = repository.save(new Post("첫 글"));
        Post second = repository.save(new Post("둘째 글"));

        assertThat(first.getId()).isEqualTo(1L);
        assertThat(second.getId()).isEqualTo(2L);
        assertThat(first.isNew()).isFalse();
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void id가_있는_글을_다시_저장하면_추가하지_않고_덮어쓴다() {
        PostRepository repository = new PostRepository();
        Post post = repository.save(new Post("첫 글"));

        post.changeTitle("고친 제목");
        repository.save(post);

        assertThat(repository.count()).isEqualTo(1);
        assertThat(repository.findById(1).getTitle()).isEqualTo("고친 제목");
    }

    @Test
    void 함정_long_id는_저장_전에도_0이라_저장_전인지_알_수_없다() {
        PrimitiveIdPost primitive = new PrimitiveIdPost("첫 글");
        Post post = new Post("첫 글");

        // 기본형 long은 null을 못 담아 기본값 0이 들어 있다. "아직 저장 전"과 "id가 0인 글"을 타입이 구분해 주지 않는다
        assertThat(primitive.getId()).isZero();
        // Long은 null로 "아직 없음"을 표현한다
        assertThat(post.getId()).isNull();
        assertThat(post.isNew()).isTrue();
    }
}
