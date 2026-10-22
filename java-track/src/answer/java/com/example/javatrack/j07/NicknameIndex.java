package com.example.javatrack.j07;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/** 실무 습관: Map 함정 — toMap 중복 키 예외, HashMap은 순서를 보장하지 않는다. */
public final class NicknameIndex {

    private NicknameIndex() {
    }

    /**
     * 닉네임 → 회원 id. 같은 닉네임이 여럿이면 먼저 나온 회원의 id를 남긴다.
     * 결과 Map을 돌면 닉네임이 목록에 처음 나온 순서대로 나와야 한다.
     */
    public static Map<String, Long> firstIdByNickname(List<MemberRow> rows) {
        return rows.stream().collect(Collectors.toMap(
                MemberRow::nickname,
                MemberRow::id,
                // 같은 키가 또 나오면 어느 값을 남길지 정한다. 이 인자가 없으면 IllegalStateException
                (first, later) -> first,
                // 기본은 HashMap이라 순서가 섞인다. 넣은 순서를 지키는 Map을 만들게 한다
                LinkedHashMap::new));
    }

    /** 회원 id → 잔액을 id 오름차순으로 도는 Map으로 바꾼다(응답·로그를 id 순으로 내보낼 때). */
    public static Map<Long, Long> sortedById(Map<Long, Long> balances) {
        // TreeMap은 키를 정렬해 담는다
        return new TreeMap<>(balances);
    }
}
