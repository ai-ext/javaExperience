package com.example.javatrack.j09;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.TimeZone;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** 주제 과제: Clock 주입과 Duration — 토큰 TTL 계산, KST 자정 경계. */
class J09TtlTest {

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

    private static final Instant ISSUED = Instant.parse("2026-10-22T01:00:00Z");
    private static final Duration TTL = Duration.ofMinutes(30);

    /** 테스트 시계는 일부러 UTC로 둔다. 호스트 기본 시간대(KST일 수 있다)에 기대는 코드를 잡아내려고. */
    private static Clock clockAt(Instant instant) {
        return Clock.fixed(instant, ZoneOffset.UTC);
    }

    @Test
    void 발급_시각은_주입한_시계에서_읽고_만료_시각은_발급_시각에_TTL을_더한다() {
        Token token = new TokenIssuer(clockAt(ISSUED), TTL).issue(7L);

        assertThat(token.memberId()).isEqualTo(7L);
        assertThat(token.issuedAt()).isEqualTo(ISSUED);
        assertThat(token.expiresAt()).isEqualTo(Instant.parse("2026-10-22T01:30:00Z"));
    }

    @Test
    void 만료_시각_1초_전에는_유효하고_만료_시각_정각부터는_만료다() {
        Token token = new TokenIssuer(clockAt(ISSUED), TTL).issue(7L);

        // 같은 TTL로 "지금"만 다른 발급기를 만들어 시간이 흐른 상황을 흉내 낸다
        TokenIssuer oneSecondBefore = new TokenIssuer(clockAt(ISSUED.plus(TTL).minusSeconds(1)), TTL);
        TokenIssuer exactlyAt = new TokenIssuer(clockAt(ISSUED.plus(TTL)), TTL);

        assertThat(oneSecondBefore.isExpired(token)).isFalse();
        assertThat(exactlyAt.isExpired(token)).isTrue();
    }

    @Test
    void 남은_시간은_만료까지의_Duration이고_이미_지났으면_0이다() {
        Token token = new TokenIssuer(clockAt(ISSUED), TTL).issue(7L);

        TokenIssuer tenMinutesLater = new TokenIssuer(clockAt(ISSUED.plus(Duration.ofMinutes(10))), TTL);
        TokenIssuer anHourLater = new TokenIssuer(clockAt(ISSUED.plus(Duration.ofHours(1))), TTL);

        assertThat(tenMinutesLater.remaining(token)).isEqualTo(Duration.ofMinutes(20));
        // 음수 Duration(-30분)을 그대로 내주면 redis TTL이나 Max-Age에 음수가 들어간다
        assertThat(anHourLater.remaining(token)).isEqualTo(Duration.ZERO);
    }

    @Test
    void TTL이_null이거나_0이거나_음수이면_거절한다() {
        Clock clock = clockAt(ISSUED);

        assertThatThrownBy(() -> new TokenIssuer(clock, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new TokenIssuer(clock, Duration.ZERO)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new TokenIssuer(clock, Duration.ofSeconds(-1))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void KST_자정_1초_전이면_다음_자정까지_1초가_남는다() {
        // 14:59:59Z = KST 23:59:59
        Clock clock = clockAt(Instant.parse("2026-10-22T14:59:59Z"));

        assertThat(MidnightTtl.untilNextKstMidnight(clock)).isEqualTo(Duration.ofSeconds(1));
    }

    @Test
    void KST_자정_정각이면_새_날이_시작됐으므로_24시간이_남는다() {
        // 15:00:00Z = KST 다음 날 00:00:00
        Clock clock = clockAt(Instant.parse("2026-10-22T15:00:00Z"));

        assertThat(MidnightTtl.untilNextKstMidnight(clock)).isEqualTo(Duration.ofHours(24));
    }

    @Test
    void UTC_자정은_KST_오전_9시라_KST_자정까지_15시간이_남는다() {
        // UTC 기준으로 계산하면 24시간이 나온다
        Clock clock = clockAt(Instant.parse("2026-10-22T00:00:00Z"));

        assertThat(MidnightTtl.untilNextKstMidnight(clock)).isEqualTo(Duration.ofHours(15));
    }

    @Test
    void 시계의_zone이_무엇이든_같은_순간이면_같은_TTL이다() {
        Instant now = Instant.parse("2026-10-22T10:30:00Z"); // KST 19:30
        Clock utc = Clock.fixed(now, ZoneOffset.UTC);
        Clock newYork = Clock.fixed(now, ZoneId.of("America/New_York"));
        Clock seoul = Clock.fixed(now, ZoneId.of("Asia/Seoul"));

        Duration expected = Duration.ofHours(4).plusMinutes(30);
        assertThat(MidnightTtl.untilNextKstMidnight(utc)).isEqualTo(expected);
        assertThat(MidnightTtl.untilNextKstMidnight(newYork)).isEqualTo(expected);
        assertThat(MidnightTtl.untilNextKstMidnight(seoul)).isEqualTo(expected);
    }
}
