package com.example.javatrack.j06;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 태그별 글 수를 세어 많은 순, 같은 수는 태그 이름순으로(Comparator.thenComparing). */
class J06BasicsTest {

    @Test
    void 태그별_글_수를_많은_순으로_정렬한다() {
        List<List<String>> tagsOfPosts = List.of(
                List.of("spring", "java"),
                List.of("java"),
                List.of("java", "jpa"));

        assertThat(TagRanking.rank(tagsOfPosts)).first().isEqualTo(new TagCount("java", 3));
    }

    @Test
    void 글_수가_같으면_태그_이름_오름차순이다() {
        List<List<String>> tagsOfPosts = List.of(
                List.of("spring", "java"),
                List.of("jpa", "java"),
                List.of("spring", "jpa", "mybatis"));

        assertThat(TagRanking.rank(tagsOfPosts)).containsExactly(
                new TagCount("java", 2),
                new TagCount("jpa", 2),
                new TagCount("spring", 2),
                new TagCount("mybatis", 1));
    }

    @Test
    void 글이_없으면_빈_목록이다() {
        assertThat(TagRanking.rank(List.of())).isEmpty();
    }
}
