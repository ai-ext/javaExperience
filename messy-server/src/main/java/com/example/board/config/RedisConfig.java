package com.example.board.config;

import org.springframework.boot.data.redis.autoconfigure.LettuceClientOptionsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.lettuce.core.ClientOptions;

/**
 * Lettuce 연결 동작. 명령 타임아웃(500ms)·연결 타임아웃은 application.yml의 spring.data.redis.* 값이다.
 * Redis는 캐시·거름망이라 없어도 서비스가 돌아야 한다. 그래서 기다리지 않고 빨리 실패하게 둔다.
 */
@Configuration
public class RedisConfig {

    @Bean
    LettuceClientOptionsBuilderCustomizer failFastClientOptions() {
        return options -> options
                // 끊긴 동안 명령을 쌓아 두지 않고 바로 거절한다. 기본값(쌓기)이면 재연결될 때까지 타임아웃만큼 기다린다.
                .disconnectedBehavior(ClientOptions.DisconnectedBehavior.REJECT_COMMANDS)
                // 끊기면 뒤에서 다시 붙는다. 기동 때 Redis가 없어도 나중에 살아나면 캐시가 다시 동작한다.
                .autoReconnect(true);
    }
}
