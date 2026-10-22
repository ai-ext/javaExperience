package com.example.board.config;

import java.time.Duration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

// 설정은 이 클래스로만 읽는다. @Value 기본값은 키 오타를 기동 때 못 잡는다.
@Validated
@ConfigurationProperties("board")
public record BoardProperties(@Valid @NotNull ForbiddenWords forbiddenWords, @Valid @NotNull Jwt jwt,
        @Valid @NotNull Pg pg) {

    public record ForbiddenWords(@NotNull Boolean ignoreCase) {
    }

    // HS256은 키가 256비트(32바이트) 이상이어야 한다
    public record Jwt(@NotBlank @Size(min = 32) String secret, @Positive long expiresInSeconds) {
    }

    // 타임아웃 셋 중 하나라도 비면 그 구간에서 요청 스레드가 끝없이 묶일 수 있어 모두 필수다.
    // secret은 콜백 서명(HMAC-SHA256) 키이고 환경 변수 BOARD_PG_SECRET으로만 주입한다.
    public record Pg(@NotBlank String baseUrl, @NotNull Duration connectTimeout, @NotNull Duration responseTimeout,
            @NotNull Duration connectionRequestTimeout, @Positive int maxConnections,
            @NotBlank @Size(min = 32) String secret) {
    }
}
