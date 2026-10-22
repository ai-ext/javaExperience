package com.example.javatrack.j05;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 타입 한 컷: 제네릭에는 래퍼만(List&lt;int&gt; 불가), IntStream·mapToLong으로 합계. */
class J05TypeCutTest {

    @Test
    void 좋아요_합계는_mapToLong으로_구한다() {
        List<Post> posts = List.of(
                new Post(1L, "첫 글", "자바초보", 3, PostStatus.ACTIVE, List.of()),
                new Post(2L, "둘째 글", "스프링입문", 5, PostStatus.ACTIVE, List.of()));

        assertThat(LikeSums.totalLikes(posts)).isEqualTo(8L);
        assertThat(LikeSums.totalLikes(List.of())).isZero();
    }

    @Test
    void 함정_int로_더하면_21억을_넘을_때_음수가_된다() {
        List<Post> posts = List.of(
                new Post(1L, "인기 글", "자바초보", 2_000_000_000, PostStatus.ACTIVE, List.of()),
                new Post(2L, "인기 글 2", "자바초보", 2_000_000_000, PostStatus.ACTIVE, List.of()));

        // int 최댓값은 2,147,483,647. 넘치면 오류 없이 음수로 돌아간다
        int overflowed = posts.stream().mapToInt(Post::getLikeCount).sum();
        assertThat(overflowed).isNegative();

        assertThat(LikeSums.totalLikes(posts)).isEqualTo(4_000_000_000L);
    }

    @Test
    void 함정_List_Integer의_remove에_int를_넘기면_값이_아니라_위치를_지운다() {
        // List<int>는 만들 수 없다(컴파일 오류라 테스트로 확인하지 않고 페이지 설명으로 다룬다). 제네릭에는 객체만 들어가므로 Integer로 담는다
        List<Integer> leaky = new ArrayList<>(List.of(10, 20, 0, 30));
        leaky.remove(0); // remove(int index)가 불려 0번 자리(10)가 지워진다
        assertThat(leaky).containsExactly(20, 0, 30);

        List<Integer> counts = new ArrayList<>(List.of(10, 20, 0, 30));
        LikeSums.removeValue(counts, 0);

        assertThat(counts).containsExactly(10, 20, 30);
    }
}
