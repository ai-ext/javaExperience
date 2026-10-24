package com.example.javatrack.j09;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.TimeZone;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** 기본기 반복: 출석 기록 목록에서 회원·KST 날짜별 첫 출석만 남기기(Map·for·정렬, Clock 주입으로 찍은 기록). */
class J09BasicsTest {

    // 기본 시간대를 KST가 아닌 곳으로 바꿔 둔다. ZoneId.systemDefault()에 기대는 답이
    // KST 개발 PC에서 우연히 통과하지 않게 하려는 것이다(테스트가 끝나면 되돌린다)
    private TimeZone originalTimeZone;

    @BeforeEach
    void 기본_시간대를_KST가_아닌_곳으로_바꾼다() {
        originalTimeZone = TimeZone.getDefault();
        TimeZone.setDefault(TimeZone.getTimeZone("America/New_York"));
    }

    @AfterEach
    void 기본_시간대를_되돌린다() {
        TimeZone.setDefault(originalTimeZone);
    }

    /** Clock.fixed로 그 순간에 출석한 기록을 만든다. 시계 zone은 UTC다. */
    private static Attendance checkIn(long memberId, String utcInstant) {
        return Attendance.at(memberId, Clock.fixed(Instant.parse(utcInstant), ZoneOffset.UTC));
    }

    @Test
    void KST_날짜마다_가장_이른_출석만_남긴다() {
        Attendance day22Morning = checkIn(1, "2026-10-21T23:00:00Z");  // KST 22일 08:00
        Attendance day22Night = checkIn(1, "2026-10-22T12:00:00Z");    // KST 22일 21:00 — 같은 날 두 번째
        Attendance day23Morning = checkIn(1, "2026-10-22T22:00:00Z");  // KST 23일 07:00

        List<Attendance> result = AttendanceBook.firstPerKstDay(List.of(day22Morning, day22Night, day23Morning));

        assertThat(result).containsExactly(day22Morning, day23Morning);
    }

    @Test
    void UTC로는_같은_날이어도_KST_자정을_넘었으면_다른_날이다() {
        Attendance beforeMidnight = checkIn(1, "2026-10-22T14:59:59Z"); // KST 22일 23:59:59
        Attendance afterMidnight = checkIn(1, "2026-10-22T15:00:00Z");  // KST 23일 00:00:00

        List<Attendance> result = AttendanceBook.firstPerKstDay(List.of(beforeMidnight, afterMidnight));

        assertThat(result).containsExactly(beforeMidnight, afterMidnight);
    }

    @Test
    void UTC로는_다른_날이어도_KST로_같은_날이면_첫_출석만_남는다() {
        Attendance first = checkIn(1, "2026-10-21T23:30:00Z");  // UTC 21일, KST 22일 08:30
        Attendance second = checkIn(1, "2026-10-22T01:00:00Z"); // UTC 22일, KST 22일 10:00

        assertThat(AttendanceBook.firstPerKstDay(List.of(first, second))).containsExactly(first);
    }

    @Test
    void 회원마다_따로_센다() {
        Attendance member1 = checkIn(1, "2026-10-22T01:00:00Z");
        Attendance member2 = checkIn(2, "2026-10-22T02:00:00Z");
        Attendance member1Again = checkIn(1, "2026-10-22T03:00:00Z");

        List<Attendance> result = AttendanceBook.firstPerKstDay(List.of(member1, member2, member1Again));

        assertThat(result).containsExactly(member1, member2);
    }

    @Test
    void 순서가_뒤섞여_들어와도_가장_이른_출석을_남기고_시각_순으로_돌려준다() {
        Attendance day23 = checkIn(1, "2026-10-23T01:00:00Z");
        Attendance day22Late = checkIn(1, "2026-10-22T09:00:00Z");
        Attendance day22Early = checkIn(1, "2026-10-22T00:30:00Z");

        List<Attendance> result = AttendanceBook.firstPerKstDay(List.of(day23, day22Late, day22Early));

        assertThat(result).containsExactly(day22Early, day23);
    }

    @Test
    void 빈_목록이면_빈_목록을_돌려준다() {
        assertThat(AttendanceBook.firstPerKstDay(List.of())).isEmpty();
    }
}
