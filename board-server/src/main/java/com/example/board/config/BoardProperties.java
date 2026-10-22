package com.example.board.config;

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
public record BoardProperties(@Valid @NotNull ForbiddenWords forbiddenWords, @Valid @NotNull Jwt jwt) {

    public record ForbiddenWords(@NotNull Boolean ignoreCase) {
    }

    // HS256은 키가 256비트(32바이트) 이상이어야 한다
    public record Jwt(@NotBlank @Size(min = 32) String secret, @Positive long expiresInSeconds) {
    }
}
