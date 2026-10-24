package com.example.board.common;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

/** 커서 방식 목록 응답. 마지막 쪽이면 nextCursor는 null이다. */
public record CursorPage<T>(List<T> items, String nextCursor) {

    /** 커서는 마지막 항목의 id를 Base64URL로 감싼 불투명 문자열이다. */
    public static String encode(long id) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(Long.toString(id).getBytes(StandardCharsets.UTF_8));
    }

    /** 첫 쪽(null·빈 값)이면 null. 서버가 준 적 없는 값은 VALIDATION 예외다. */
    public static Long decode(String cursor) {
        if (cursor == null || cursor.isEmpty()) {
            return null;
        }
        try {
            long id = Long.parseLong(new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8));
            if (id > 0) {
                return id;
            }
        } catch (IllegalArgumentException e) {
            // 아래에서 같은 예외로 처리한다
        }
        throw new BusinessException(ErrorCode.VALIDATION, "cursor가 올바르지 않습니다.");
    }
}
