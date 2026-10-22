package com.example.javatrack.j09;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/** 타입 한 컷: Instant·LocalDate·LocalDateTime·ZonedDateTime을 KST 기준으로 오가기. */
public final class KstTime {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private KstTime() {
    }

    /** 시계가 가리키는 지금의 KST 날짜. 시계의 zone(UTC 등)을 따르지 않는다. */
    public static LocalDate today(Clock clock) {
        // LocalDate.now(clock)는 시계의 zone으로 자른다. zone을 KST로 바꾼 시계를 넘긴다
        return LocalDate.now(clock.withZone(KST));
    }

    /** DB에 KST로 저장할 날짜·시각(시간대 정보 없음). */
    public static LocalDateTime toKstLocalDateTime(Instant instant) {
        return LocalDateTime.ofInstant(instant, KST);
    }

    /** KST로 저장된 날짜·시각을 타임라인 위의 한 점으로 되돌린다. */
    public static Instant fromKstLocalDateTime(LocalDateTime kstDateTime) {
        return kstDateTime.atZone(KST).toInstant();
    }

    /** 응답용 ISO-8601 KST 오프셋 문자열. 예: {@code 2026-10-22T09:30:00+09:00}(초가 0이어도 초까지 쓴다). */
    public static String toOffsetString(Instant instant) {
        // OffsetDateTime.toString()은 초가 0이면 "09:30+09:00"처럼 초를 뺀다. 형식을 고정하려고 포매터를 쓴다
        return instant.atZone(KST).toOffsetDateTime().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
}
