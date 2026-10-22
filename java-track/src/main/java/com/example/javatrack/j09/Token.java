package com.example.javatrack.j09;

import java.time.Instant;

/**
 * 주어진 record: 고치지 않는다.
 * 로그인 토큰 한 장. 시각은 {@link Instant}(시간대와 상관없는 타임라인 위 한 점)로 담는다.
 */
public record Token(Long memberId, Instant issuedAt, Instant expiresAt) {
}
