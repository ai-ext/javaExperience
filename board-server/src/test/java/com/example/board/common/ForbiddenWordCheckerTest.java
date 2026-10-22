package com.example.board.common;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

import com.example.board.config.BoardProperties;

import static org.assertj.core.api.Assertions.assertThat;

class ForbiddenWordCheckerTest {

    private ForbiddenWordChecker checker(boolean ignoreCase) {
        return new ForbiddenWordChecker(new BoardProperties(new BoardProperties.ForbiddenWords(ignoreCase)));
    }

    @Test
    void 금칙어가_포함되면_true() {
        ForbiddenWordChecker c = checker(true);
        c.replaceWords(List.of("욕설", "Spam"));

        assertThat(c.contains("이건 욕설 입니다")).isTrue();
        assertThat(c.contains("SPAM mail")).isTrue();
        assertThat(c.contains("깨끗한 글")).isFalse();
    }

    @Test
    void 대소문자_구분_설정을_따른다() {
        ForbiddenWordChecker c = checker(false);
        c.replaceWords(List.of("spam"));

        assertThat(c.contains("SPAM")).isFalse();
        assertThat(c.contains("spam")).isTrue();
    }

    @Test
    void null과_빈_문자열은_false() {
        ForbiddenWordChecker c = checker(true);
        c.replaceWords(List.of("x"));

        assertThat(c.contains(null)).isFalse();
        assertThat(c.contains("")).isFalse();
    }

    @Test
    void 요청마다_바뀌는_상태_필드가_없다() {
        // 싱글톤 빈에 lastMatched 같은 필드를 두면 동시 요청끼리 섞인다
        Set<String> mutable = Stream.of(ForbiddenWordChecker.class.getDeclaredFields())
                .filter(f -> !Modifier.isStatic(f.getModifiers()))
                .filter(f -> !Modifier.isFinal(f.getModifiers()) && !Modifier.isVolatile(f.getModifiers()))
                .map(Field::getName)
                .collect(Collectors.toSet());

        assertThat(mutable).isEmpty();
    }
}
