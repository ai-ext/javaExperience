package com.example.javatrack.j10;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/** 기본기 반복: 감사 로그 집계. */
public final class AuditStats {

    private AuditStats() {
    }

    /**
     * action별 건수를 센다. action이 null인 옛 기록은 건너뛴다.
     * 돌려주는 Map은 고칠 수 없어야 한다(put 등을 부르면 UnsupportedOperationException).
     */
    public static Map<String, Long> countByAction(List<AuditEntry> entries) {
        Map<String, Long> counts = entries.stream()
                .map(AuditEntry::action)
                // groupingBy는 null 키에서 NPE를 던지므로 먼저 거른다
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(action -> action, Collectors.counting()));
        // groupingBy가 만든 것은 가변 HashMap이다. 복사해 불변으로 내준다
        return Map.copyOf(counts);
    }
}
