package com.example.javatrack.j10;

import java.util.List;
import java.util.Map;

/** 기본기 반복: 감사 로그 집계. */
public final class AuditStats {

    private AuditStats() {
    }

    /**
     * action별 건수를 센다. action이 null인 옛 기록은 건너뛴다.
     * 돌려주는 Map은 고칠 수 없어야 한다(put 등을 부르면 UnsupportedOperationException).
     */
    public static Map<String, Long> countByAction(List<AuditEntry> entries) {
        throw new UnsupportedOperationException("J10: AuditStats.countByAction — groupingBy·counting으로 세고 불변 Map으로 돌려주세요");
    }
}
