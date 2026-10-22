package com.example.javatrack.j07;

import java.util.List;
import java.util.Map;

/** 기본기 반복: 회원별로 묶고 회원별로 더하기. */
public final class PointBasics {

    private PointBasics() {
    }

    /** 회원 id별로 이력을 묶는다. 한 회원의 목록은 들어온 순서를 지킨다. */
    public static Map<Long, List<PointEntry>> groupByMember(List<PointEntry> entries) {
        throw new UnsupportedOperationException("J07: PointBasics.groupByMember — for와 computeIfAbsent(또는 groupingBy)로 묶으세요");
    }

    /** 묶인 이력으로 회원별 잔액(amount 합)을 구한다. */
    public static Map<Long, Long> balances(Map<Long, List<PointEntry>> entriesByMember) {
        throw new UnsupportedOperationException("J07: PointBasics.balances — 회원마다 amount를 더하세요");
    }
}
