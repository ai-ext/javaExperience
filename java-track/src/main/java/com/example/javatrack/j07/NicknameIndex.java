package com.example.javatrack.j07;

import java.util.List;
import java.util.Map;

/** 실무 습관: Map 함정 — toMap 중복 키 예외, HashMap은 순서를 보장하지 않는다. */
public final class NicknameIndex {

    private NicknameIndex() {
    }

    /**
     * 닉네임 → 회원 id. 같은 닉네임이 여럿이면 먼저 나온 회원의 id를 남긴다.
     * 결과 Map을 돌면 닉네임이 목록에 처음 나온 순서대로 나와야 한다.
     */
    public static Map<String, Long> firstIdByNickname(List<MemberRow> rows) {
        throw new UnsupportedOperationException("J07: NicknameIndex.firstIdByNickname — toMap에 합치는 함수와 LinkedHashMap::new를 넘기세요");
    }

    /** 회원 id → 잔액을 id 오름차순으로 도는 Map으로 바꾼다(응답·로그를 id 순으로 내보낼 때). */
    public static Map<Long, Long> sortedById(Map<Long, Long> balances) {
        throw new UnsupportedOperationException("J07: NicknameIndex.sortedById — 키 순서로 정렬되는 Map에 담으세요");
    }
}
