package com.example.javatrack.j09;

import java.time.Clock;
import java.time.Duration;
import java.time.ZoneId;

/** 하루 단위로 초기화되는 키(오늘 출석 여부 등)의 TTL. 기준 날짜는 한국 시간(KST)이다. */
public final class MidnightTtl {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private MidnightTtl() {
    }

    /**
     * 지금부터 다음 KST 자정까지 남은 시간. 시계의 zone과 상관없이 KST로 센다.
     * 예: KST 23:59:59이면 1초, KST 00:00:00 정각이면 24시간(이미 새 날이 시작됐으므로 그다음 자정까지).
     */
    public static Duration untilNextKstMidnight(Clock clock) {
        throw new UnsupportedOperationException("J09: MidnightTtl.untilNextKstMidnight — KST 지금 시각에서 다음 날 0시까지의 Duration을 구하세요");
    }
}
