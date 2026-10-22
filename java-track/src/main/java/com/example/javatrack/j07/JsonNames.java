package com.example.javatrack.j07;

import java.lang.reflect.Field;
import java.util.List;

/**
 * 타입 한 컷: {@code @Getter}가 만든 getter를 JSON 라이브러리가 읽었을 때, 필드가 어떤 응답 이름으로 나가는가.
 * <ul>
 *   <li>기본형 {@code boolean}이고 이름이 "is" + 대문자로 시작하면(isExpired): getter가 isExpired()라 응답 이름은 "is"를 뗀 expired</li>
 *   <li>그 밖(Boolean 래퍼, issued처럼 "is" 다음이 소문자, 다른 타입): 필드 이름 그대로</li>
 * </ul>
 * "is"를 뗀 뒤에는 첫 글자를 소문자로 바꾼다(Expired → expired).
 */
public final class JsonNames {

    private JsonNames() {
    }

    /** 필드 하나의 응답 이름. */
    public static String jsonName(Field field) {
        throw new UnsupportedOperationException("J07: JsonNames.jsonName — boolean이고 is+대문자면 is를 떼고 첫 글자를 소문자로");
    }

    /** 클래스의 인스턴스 필드(static 제외)마다 응답 이름을 선언 순서대로. */
    public static List<String> jsonNames(Class<?> type) {
        throw new UnsupportedOperationException("J07: JsonNames.jsonNames — getDeclaredFields를 돌며 jsonName을 모으세요");
    }
}
