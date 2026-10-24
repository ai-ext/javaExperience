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
    // 적재 시 통째로 교체하는 불변 집합
    private volatile Set<String> words = Set.of();
    // 같은 글을 제목·본문·수정 때 연달아 검사하는 일이 많아 마지막 정규화 결과를 재사용한다.
    // 여러 요청 스레드가 함께 읽으므로 volatile로 둔다.
    private volatile String lastText;
    private volatile String lastFolded;

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
        if (!text.equals(lastText)) {
            lastText = text;
            lastFolded = fold(text);
        }
        for (String word : words) {
            if (lastFolded.contains(word)) {
                return true;
            }
        }
        return false;
    }

    private String fold(String s) {
        return ignoreCase ? s.toLowerCase(Locale.ROOT) : s;
    }
}
