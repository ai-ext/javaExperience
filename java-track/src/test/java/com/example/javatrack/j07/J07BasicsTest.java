package com.example.javatrack.j07;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 회원별 포인트 이력을 Map&lt;Long, List&lt;PointEntry&gt;&gt;로 묶고 회원별 잔액 계산. */
class J07BasicsTest {

    private static final List<PointEntry> ENTRIES = List.of(
            new PointEntry(1, 7, 100),
            new PointEntry(2, 8, 50),
            new PointEntry(3, 7, -30),
            new PointEntry(4, 7, 10));

    @Test
    void 회원별로_이력을_묶고_각_목록은_들어온_순서를_지킨다() {
        Map<Long, List<PointEntry>> byMember = PointBasics.groupByMember(ENTRIES);

        assertThat(byMember).containsOnlyKeys(7L, 8L);
        assertThat(byMember.get(7L)).extracting(PointEntry::id).containsExactly(1L, 3L, 4L);
        assertThat(byMember.get(8L)).extracting(PointEntry::id).containsExactly(2L);
    }

    @Test
    void 회원별_잔액은_적립과_사용을_더한_값이다() {
        Map<Long, Long> balances = PointBasics.balances(PointBasics.groupByMember(ENTRIES));

        assertThat(balances).containsOnly(Map.entry(7L, 80L), Map.entry(8L, 50L));
    }

    @Test
    void 이력이_없으면_빈_Map이다() {
        assertThat(PointBasics.groupByMember(List.of())).isEmpty();
        assertThat(PointBasics.balances(Map.of())).isEmpty();
    }
}
