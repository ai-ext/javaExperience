package com.example.board.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

// 설정은 이 클래스로만 읽는다. @Value 기본값은 키 오타를 기동 때 못 잡는다.
@Validated
@ConfigurationProperties("board")
public record BoardProperties(@Valid @NotNull ForbiddenWords forbiddenWords) {

    public record ForbiddenWords(@NotNull Boolean ignoreCase) {
    }
}
