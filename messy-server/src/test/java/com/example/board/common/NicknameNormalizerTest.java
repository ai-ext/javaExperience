package com.example.board.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NicknameNormalizerTest {

    @Test
    void 앞뒤_공백을_제거한다() {
        assertThat(NicknameNormalizer.normalize("  홍길동  ")).isEqualTo("홍길동");
    }

    @Test
    void 연속_공백을_하나로_줄인다() {
        assertThat(NicknameNormalizer.normalize("a   b \t c")).isEqualTo("a b c");
    }

    @Test
    void 소문자로_바꾼다() {
        assertThat(NicknameNormalizer.normalize("  BoArD  ")).isEqualTo("board");
    }

    @Test
    void null은_빈_문자열() {
        assertThat(NicknameNormalizer.normalize(null)).isEmpty();
    }
}
