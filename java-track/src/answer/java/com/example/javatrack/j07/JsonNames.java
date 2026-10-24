package com.example.javatrack.j07;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;

/**
 * 타입 한 컷(선택 과제): {@code @Getter}가 만든 getter를 JSON 라이브러리가 읽었을 때, 필드가 어떤 응답 이름으로 나가는가.
 * 여기서 다루는 필드 모양(getX·boolean isX getter)에 한해 JavaBeans 규칙({@code java.beans.Introspector})을 따른다.
 * <ul>
 *   <li>기본형 {@code boolean}이고 이름이 "is" + 대문자로 시작하면(isExpired): getter가 isExpired()라 응답 이름은 "is"를 뗀 이름</li>
 *   <li>그 밖(Boolean 래퍼, issued처럼 "is" 다음이 소문자, 다른 타입): 필드 이름 그대로</li>
 * </ul>
 * "is"를 뗀 뒤에는 {@code Introspector.decapitalize} 규칙을 쓴다: 앞 두 글자가 모두 대문자면 그대로(URL → URL),
 * 아니면 첫 글자만 소문자로(Expired → expired).
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
            return decapitalize(name.substring(2));
        }
        return name;
    }

    /** Introspector.decapitalize와 같은 규칙. 앞 두 글자가 모두 대문자(약어)면 그대로 둔다: URL → URL, Expired → expired. */
    private static String decapitalize(String name) {
        if (name.length() > 1 && Character.isUpperCase(name.charAt(0)) && Character.isUpperCase(name.charAt(1))) {
            return name;
        }
        return Character.toLowerCase(name.charAt(0)) + name.substring(1);
    }

    /** 클래스의 인스턴스 필드(static 제외)마다 응답 이름. 순서는 정하지 않는다(getDeclaredFields는 선언 순서를 보장하지 않는다). */
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
