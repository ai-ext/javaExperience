package com.example.board.common;

import java.util.Collection;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.example.board.config.BoardProperties;

@Component
public class ForbiddenWordChecker {

    private final boolean ignoreCase;
    // 적재 시 통째로 교체하는 불변 집합. 요청별 상태는 두지 않는다.
    private volatile Set<String> words = Set.of();

    public ForbiddenWordChecker(BoardProperties properties) {
        this.ignoreCase = properties.forbiddenWords().ignoreCase();
    }

    public void replaceWords(Collection<String> newWords) {
        this.words = newWords.stream().map(this::fold).collect(Collectors.toUnmodifiableSet());
    }

    public int size() {
        return words.size();
    }

    public boolean contains(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        String target = fold(text);
        return words.stream().anyMatch(target::contains);
    }

    private String fold(String s) {
        return ignoreCase ? s.toLowerCase(Locale.ROOT) : s;
    }
}
