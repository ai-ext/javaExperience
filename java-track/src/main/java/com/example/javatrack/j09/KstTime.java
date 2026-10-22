package com.example.javatrack.j09;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/** 타입 한 컷: Instant·LocalDate·LocalDateTime·ZonedDateTime을 KST 기준으로 오가기. */
public final class KstTime {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private KstTime() {
    }

    /** 시계가 가리키는 지금의 KST 날짜. 시계의 zone(UTC 등)을 따르지 않는다. */
    public static LocalDate today(Clock clock) {
        throw new UnsupportedOperationException("J09: KstTime.today — 시계의 지금 시각을 KST 날짜로 바꾸세요");
    }

    /** DB에 KST로 저장할 날짜·시각(시간대 정보 없음). */
    public static LocalDateTime toKstLocalDateTime(Instant instant) {
        throw new UnsupportedOperationException("J09: KstTime.toKstLocalDateTime — Instant를 KST 날짜·시각으로 바꾸세요");
    }

    /** KST로 저장된 날짜·시각을 타임라인 위의 한 점으로 되돌린다. */
    public static Instant fromKstLocalDateTime(LocalDateTime kstDateTime) {
        throw new UnsupportedOperationException("J09: KstTime.fromKstLocalDateTime — KST라는 zone을 붙여 Instant로 바꾸세요");
    }

    /** 응답용 ISO-8601 KST 오프셋 문자열. 예: {@code 2026-10-22T09:30:00+09:00}(초가 0이어도 초까지 쓴다). */
    public static String toOffsetString(Instant instant) {
        throw new UnsupportedOperationException("J09: KstTime.toOffsetString — KST 오프셋을 붙인 ISO 문자열을 만드세요");
    }
}
