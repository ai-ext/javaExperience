package com.example.board.common;

import java.util.Locale;

/** 상태가 없는 순수 함수라 빈이 아니라 static 유틸로 둔다. */
public final class NicknameNormalizer {

    private NicknameNormalizer() {
    }

    public static String normalize(String nickname) {
        if (nickname == null) {
            return "";
        }
        return nickname.strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
