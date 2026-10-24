package com.example.javatrack.j03;

import java.util.List;
import java.util.Map;

/** 기본기 반복: 역할별 회원 수 세기, 공백만 있는 닉네임 거절. */
public final class MemberBasics {

    private MemberBasics() {
    }

    /** for로 돌며 역할별 회원 수를 센다. 한 명도 없는 역할도 0으로 들어 있어야 한다. */
    public static Map<Role, Integer> countByRole(List<MemberRow> rows) {
        throw new UnsupportedOperationException("J03: MemberBasics.countByRole — 모든 Role을 0으로 넣고 for로 세세요");
    }

    /** null이거나 공백뿐이면(isBlank) IllegalArgumentException. 통과하면 앞뒤 공백을 지운 값을 돌려준다. */
    public static String requireNickname(String nickname) {
        throw new UnsupportedOperationException("J03: MemberBasics.requireNickname — isBlank로 거절하고 strip한 값을 돌려주세요");
    }
}
