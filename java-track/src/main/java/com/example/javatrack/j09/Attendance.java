package com.example.javatrack.j09;

import java.time.Clock;
import java.time.Instant;

/**
 * 주어진 record: 고치지 않는다.
 * 출석 기록 한 건. 서버는 {@link #at}처럼 주입받은 {@link Clock}으로 시각을 찍는다(테스트는 {@code Clock.fixed}를 넘긴다).
 */
public record Attendance(Long memberId, Instant checkedAt) {

    /** clock이 가리키는 지금 시각으로 출석을 기록한다. */
    public static Attendance at(Long memberId, Clock clock) {
        return new Attendance(memberId, clock.instant());
    }
}
