package com.example.javatrack.j09;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.TimeZone;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** 타입 한 컷: LocalDate·LocalDateTime·Instant·ZonedDateTime의 차이 — 출석 자정 경계, 토큰 만료. */
class J09TypeCutTest {

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

    // KST 23일 00:30. UTC로는 아직 22일이다
    private static final Instant JUST_AFTER_KST_MIDNIGHT = Instant.parse("2026-10-22T15:30:00Z");

    @Test
    void today는_시계의_zone이_아니라_KST_날짜를_돌려준다() {
        Clock utcClock = Clock.fixed(JUST_AFTER_KST_MIDNIGHT, ZoneOffset.UTC);

        assertThat(KstTime.today(utcClock)).isEqualTo(LocalDate.of(2026, 10, 23));
    }

    @Test
    void 함정_UTC_시계로_LocalDate_now를_부르면_KST_자정_직후가_어제가_된다() {
        Clock utcClock = Clock.fixed(JUST_AFTER_KST_MIDNIGHT, ZoneOffset.UTC);

        // LocalDate.now(clock)는 시계의 zone(UTC)으로 날짜를 자른다. 서버 시간대가 UTC면 운영에서 이렇게 된다
        assertThat(LocalDate.now(utcClock)).isEqualTo(LocalDate.of(2026, 10, 22));
        // 출석 날짜는 KST로 잘라야 한다
        assertThat(KstTime.today(utcClock)).isEqualTo(LocalDate.of(2026, 10, 23));
    }

    @Test
    void 같은_Instant도_어느_zone으로_보느냐에_따라_LocalDateTime이_다르다() {
        Instant instant = Instant.parse("2026-10-22T00:30:00Z");

        assertThat(LocalDateTime.ofInstant(instant, ZoneOffset.UTC)).isEqualTo(LocalDateTime.of(2026, 10, 22, 0, 30));
        assertThat(KstTime.toKstLocalDateTime(instant)).isEqualTo(LocalDateTime.of(2026, 10, 22, 9, 30));
    }

    @Test
    void LocalDateTime에는_시간대가_없어_KST라는_zone을_붙여야_Instant로_되돌아간다() {
        LocalDateTime storedInKst = LocalDateTime.of(2026, 10, 22, 9, 30);

        assertThat(KstTime.fromKstLocalDateTime(storedInKst)).isEqualTo(Instant.parse("2026-10-22T00:30:00Z"));
        // 왕복해도 같은 순간이다
        assertThat(KstTime.toKstLocalDateTime(KstTime.fromKstLocalDateTime(storedInKst))).isEqualTo(storedInKst);
    }

    @Test
    void 응답에는_KST_오프셋을_붙인_ISO_문자열로_내보낸다() {
        assertThat(KstTime.toOffsetString(Instant.parse("2026-10-22T00:30:00Z")))
                .isEqualTo("2026-10-22T09:30:00+09:00");
    }
}
