package com.example.javatrack.j07;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
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
        String name = field.getName();
        // boolean.class는 기본형, Boolean.class는 래퍼. 래퍼 필드의 getter는 getIsHidden()이라 이름이 그대로 남는다
        boolean primitiveBoolean = field.getType() == boolean.class;
        if (primitiveBoolean && name.length() > 2 && name.startsWith("is") && Character.isUpperCase(name.charAt(2))) {
            return Character.toLowerCase(name.charAt(2)) + name.substring(3);
        }
        return name;
    }

    /** 클래스의 인스턴스 필드(static 제외)마다 응답 이름을 선언 순서대로. */
    public static List<String> jsonNames(Class<?> type) {
        List<String> names = new ArrayList<>();
        for (Field field : type.getDeclaredFields()) {
            if (!Modifier.isStatic(field.getModifiers())) {
                names.add(jsonName(field));
            }
        }
        return names;
    }
}
