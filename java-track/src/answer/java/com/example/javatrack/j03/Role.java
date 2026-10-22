package com.example.javatrack.j03;

import java.util.Arrays;
import java.util.Locale;

/**
 * 회원 역할. 상수마다 화면에 보일 이름(label)을 가진다.
 * enum 상수는 JVM에 하나씩만 있으므로 {@code ==}로 비교해도 안전하다.
 */
public enum Role {
    USER("일반 회원"),
    ADMIN("관리자");

    private final String label;

    Role(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /**
     * 요청·토큰에서 온 문자열을 역할로 바꾼다. 앞뒤 공백과 대소문자는 무시한다({@code " admin "} → ADMIN).
     * null·공백·없는 이름이면 IllegalArgumentException이고, 메시지에 허용된 값(USER, ADMIN)을 모두 적는다.
     */
    public static Role from(String value) {
        if (value != null) {
            String name = value.strip().toUpperCase(Locale.ROOT);
            for (Role role : values()) {
                if (role.name().equals(name)) {
                    return role;
                }
            }
        }
        // valueOf는 null이면 NPE, 없는 이름이면 허용 값을 알려 주지 않는 IAE를 던진다
        throw new IllegalArgumentException("역할은 " + Arrays.toString(values()) + " 중 하나여야 합니다: " + value);
    }
}
