package com.example.javatrack.j04;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 태그 목록에서 빈 문자열·공백을 지우고 중복을 제거해 최대 5개만 남기기. */
class J04BasicsTest {

    @Test
    void 빈_문자열과_공백뿐인_태그를_지운다() {
        assertThat(TagCleaner.clean(List.of("java", "", "   ", "　", "spring"))).containsExactly("java", "spring");
    }

    @Test
    void 앞뒤_공백을_지운_뒤_중복을_없애고_처음_순서를_지킨다() {
        assertThat(TagCleaner.clean(List.of("spring", " java", "java ", "spring", "jpa")))
                .containsExactly("spring", "java", "jpa");
    }

    @Test
    void 중복을_뺀_뒤_앞에서부터_최대_5개만_남긴다() {
        List<String> tags = List.of("a", "a", "b", "c", "d", "e", "f", "g");

        assertThat(TagCleaner.clean(tags)).containsExactly("a", "b", "c", "d", "e");
    }

    @Test
    void null_태그는_건너뛴다() {
        // List.of는 null을 담을 수 없어 Arrays.asList로 만든다
        assertThat(TagCleaner.clean(Arrays.asList("java", null, "spring"))).containsExactly("java", "spring");
    }
}
