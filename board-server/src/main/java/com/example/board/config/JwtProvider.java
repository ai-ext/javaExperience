package com.example.board.config;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Date;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.AuthMember;
import com.example.board.member.Role;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long expiresInSeconds;
    private final Clock clock;

    @Autowired
    public JwtProvider(BoardProperties properties) {
        this(properties, Clock.systemUTC());
    }

    // 만료 토큰 테스트를 위해 시계를 주입할 수 있게 둔다
    JwtProvider(BoardProperties properties, Clock clock) {
        this.key = Keys.hmacShaKeyFor(properties.jwt().secret().getBytes(StandardCharsets.UTF_8));
        this.expiresInSeconds = properties.jwt().expiresInSeconds();
        this.clock = clock;
    }

    public String issue(Long memberId, Role role) {
        Date now = Date.from(clock.instant());
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .claim("role", role.name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiresInSeconds * 1000))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public long expiresInSeconds() {
        return expiresInSeconds;
    }

    public AuthMember parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).clock(() -> Date.from(clock.instant())).build()
                    .parseSignedClaims(token).getPayload();
            return new AuthMember(Long.valueOf(claims.getSubject()), Role.valueOf(claims.get("role", String.class)));
        } catch (JwtException | IllegalArgumentException e) {
            // 서명 불일치·만료·형식 오류를 구분해 알리지 않는다
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "유효하지 않은 토큰입니다.");
        }
    }
}
