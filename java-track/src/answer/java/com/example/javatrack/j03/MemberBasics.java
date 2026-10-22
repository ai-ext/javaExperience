package com.example.javatrack.j03;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** 기본기 반복: 역할별 회원 수 세기, 공백만 있는 닉네임 거절. */
public final class MemberBasics {

    private MemberBasics() {
    }

    /** for로 돌며 역할별 회원 수를 센다. 한 명도 없는 역할도 0으로 들어 있어야 한다. */
    public static Map<Role, Integer> countByRole(List<MemberRow> rows) {
        // EnumMap은 enum 키 전용 Map이다. 키가 선언 순서(USER, ADMIN)로 정렬된다
        Map<Role, Integer> counts = new EnumMap<>(Role.class);
        for (Role role : Role.values()) {
            counts.put(role, 0);
        }
        for (MemberRow row : rows) {
            counts.put(row.role(), counts.get(row.role()) + 1);
        }
        return counts;
    }

    /** null이거나 공백뿐이면(isBlank) IllegalArgumentException. 통과하면 앞뒤 공백을 지운 값을 돌려준다. */
    public static String requireNickname(String nickname) {
        // isEmpty는 길이 0만 거른다. "   "은 isEmpty가 false라 통과해 버린다
        if (nickname == null || nickname.isBlank()) {
            throw new IllegalArgumentException("닉네임이 비었습니다");
        }
        return nickname.strip();
    }
}
