package com.example.javatrack.j09;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

/**
 * 토큰 발급기. "지금"은 언제나 주입받은 {@link Clock}에서 읽는다({@code Instant.now()}를 직접 부르지 않는다).
 * <ul>
 *   <li>ttl이 null이거나 0 이하면 생성자가 {@link IllegalArgumentException}을 던진다</li>
 *   <li>만료 시각 = 발급 시각 + ttl</li>
 *   <li>지금이 만료 시각과 같거나 지났으면 만료다(JWT의 exp와 같다)</li>
 * </ul>
 */
public class TokenIssuer {

    private final Clock clock;
    private final Duration ttl;

    public TokenIssuer(Clock clock, Duration ttl) {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException("TTL은 0보다 커야 합니다: " + ttl);
        }
        this.clock = clock;
        this.ttl = ttl;
    }

    /** 지금 시각으로 발급하고, 만료 시각은 지금 + ttl이다. */
    public Token issue(Long memberId) {
        Instant now = clock.instant();
        return new Token(memberId, now, now.plus(ttl));
    }

    /** 지금이 만료 시각과 같거나 지났으면 true. */
    public boolean isExpired(Token token) {
        // "지금이 만료 시각 전인가"의 반대. isAfter로 쓰면 만료 시각 정각을 유효로 잘못 본다
        return !clock.instant().isBefore(token.expiresAt());
    }

    /** 만료까지 남은 시간. 이미 만료됐으면 {@link Duration#ZERO}. */
    public Duration remaining(Token token) {
        Duration left = Duration.between(clock.instant(), token.expiresAt());
        return left.isNegative() ? Duration.ZERO : left;
    }
}
