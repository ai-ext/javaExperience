package com.example.javatrack.j02;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 좋아요 합계(for와 stream), 쉼표로 이어진 태그 문자열을 split·strip으로 나누기. */
class J02BasicsTest {

    private static final List<PostRow> ROWS = List.of(
            new PostRow(1, "첫 글", 3),
            new PostRow(2, "둘째 글", 0),
            new PostRow(3, "셋째 글", 12));

    @Test
    void 좋아요_합계를_for와_stream으로_구해도_같다() {
        assertThat(PostBasics.sumLikesWithFor(ROWS)).isEqualTo(15);
        assertThat(PostBasics.sumLikesWithStream(ROWS)).isEqualTo(15);
    }

    @Test
    void 빈_목록의_좋아요_합계는_0이다() {
        assertThat(PostBasics.sumLikesWithFor(List.of())).isZero();
        assertThat(PostBasics.sumLikesWithStream(List.of())).isZero();
    }

    @Test
    void 쉼표로_나눈_태그의_앞뒤_공백을_지운다() {
        assertThat(PostBasics.splitTags(" java, spring ,jpa ")).containsExactly("java", "spring", "jpa");
    }

    @Test
    void strip은_전각_공백도_지우지만_trim은_못_지운다() {
        String raw = "　spring　";

        // trim()은 코드값이 ' '(32) 이하인 문자만 지운다. 전각 공백(　)은 남는다
        assertThat(raw.trim()).isEqualTo(raw);
        assertThat(PostBasics.splitTags(raw + ",java")).containsExactly("spring", "java");
    }

    @Test
    void 빈_조각은_버리고_null이나_공백뿐인_문자열이면_빈_리스트다() {
        assertThat(PostBasics.splitTags("java,, ,spring,")).containsExactly("java", "spring");
        assertThat(PostBasics.splitTags(null)).isEmpty();
        assertThat(PostBasics.splitTags("   ")).isEmpty();
    }
}
