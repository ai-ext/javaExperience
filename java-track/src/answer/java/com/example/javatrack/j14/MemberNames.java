package com.example.javatrack.j14;

import java.util.List;
import java.util.Objects;

/** 기본기 반복: null이 섞인 회원 목록 다루기. */
public final class MemberNames {

    private MemberNames() {
    }

    /**
     * null인 회원과 닉네임이 null인 회원을 거르고, 닉네임을 가나다순으로 정렬해 {@code ", "}로 잇는다.
     * 남는 회원이 없으면 빈 문자열.
     */
    public static String joinNicknames(List<Member> members) {
        // 회원 null을 먼저 걸러야 member.nickname()에서 NPE가 나지 않는다
        List<String> nicknames = members.stream()
                .filter(Objects::nonNull)
                .map(Member::nickname)
                .filter(Objects::nonNull)
                .sorted()
                .toList();
        return String.join(", ", nicknames);
    }
}
