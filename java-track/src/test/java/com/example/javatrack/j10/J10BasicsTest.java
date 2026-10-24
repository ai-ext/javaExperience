package com.example.javatrack.j10;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 감사 로그 목록에서 action별 건수를 집계해 불변 Map으로 돌려준다(stream·groupingBy). */
class J10BasicsTest {

    private static AuditEntry entry(String action) {
        return new AuditEntry(1L, action, "POST", 10L);
    }

    @Test
    void action별_건수를_센다() {
        List<AuditEntry> entries = List.of(
                entry("HIDE_POST"), entry("BULK_ISSUE_COUPON"), entry("HIDE_POST"), entry("HIDE_POST"));

        Map<String, Long> counts = AuditStats.countByAction(entries);

        assertThat(counts).containsOnly(Map.entry("HIDE_POST", 3L), Map.entry("BULK_ISSUE_COUPON", 1L));
    }

    @Test
    void 빈_목록이면_빈_Map을_돌려준다() {
        assertThat(AuditStats.countByAction(List.of())).isEmpty();
    }

    @Test
    void action이_null인_옛_기록은_예외_없이_건너뛴다() {
        // groupingBy는 분류 키가 null이면 NPE를 던진다. 먼저 걸러야 한다
        List<AuditEntry> entries = List.of(entry(null), entry("HIDE_POST"), entry(null));

        Map<String, Long> counts = AuditStats.countByAction(entries);

        assertThat(counts).containsOnly(Map.entry("HIDE_POST", 1L));
    }

    @Test
    void 돌려준_Map은_고칠_수_없다() {
        // 학습자 코드의 반환값은 람다 밖에서 먼저 받는다(뼈대의 예외와 섞이지 않게)
        Map<String, Long> counts = AuditStats.countByAction(List.of(entry("HIDE_POST")));

        assertThatThrownBy(() -> counts.put("HIDE_POST", 100L))
                .isInstanceOf(UnsupportedOperationException.class);
        assertThat(counts).containsOnly(Map.entry("HIDE_POST", 1L));
    }
}
