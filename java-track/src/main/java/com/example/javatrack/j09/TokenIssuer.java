package com.example.javatrack.j09;

import java.time.Clock;
import java.time.Duration;

/**
 * 토큰 발급기. "지금"은 언제나 주입받은 {@link Clock}에서 읽는다({@code Instant.now()}를 직접 부르지 않는다).
 * <ul>
 *   <li>ttl이 null이거나 0 이하면 생성자가 {@link IllegalArgumentException}을 던진다</li>
 *   <li>만료 시각 = 발급 시각 + ttl</li>
 *   <li>지금이 만료 시각과 같거나 지났으면 만료다(JWT의 exp와 같다)</li>
 * </ul>
 */
public class TokenIssuer {

    // TODO: 시계와 TTL 필드를 선언하세요(만든 뒤 바뀌지 않게)

    public TokenIssuer(Clock clock, Duration ttl) {
        throw new UnsupportedOperationException("J09: TokenIssuer 생성자 — ttl을 검사하고 시계·TTL을 필드에 담으세요");
    }

    /** 지금 시각으로 발급하고, 만료 시각은 지금 + ttl이다. */
    public Token issue(Long memberId) {
        throw new UnsupportedOperationException("J09: TokenIssuer.issue — 시계의 지금 시각과 ttl로 Token을 만드세요");
    }

    /** 지금이 만료 시각과 같거나 지났으면 true. */
    public boolean isExpired(Token token) {
        throw new UnsupportedOperationException("J09: TokenIssuer.isExpired — 지금과 만료 시각을 비교하세요");
    }

    /** 만료까지 남은 시간. 이미 만료됐으면 {@link Duration#ZERO}. */
    public Duration remaining(Token token) {
        throw new UnsupportedOperationException("J09: TokenIssuer.remaining — Duration.between으로 남은 시간을 구하세요");
    }
}
