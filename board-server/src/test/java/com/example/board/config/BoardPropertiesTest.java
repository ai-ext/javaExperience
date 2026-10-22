package com.example.board.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

class BoardPropertiesTest {

    @Configuration
    @EnableConfigurationProperties(BoardProperties.class)
    static class Config {
    }

    private final ApplicationContextRunner runner = new ApplicationContextRunner().withUserConfiguration(Config.class);

    @Test
    void forbidden_words_값이_객체로_바인딩된다() {
        runner.withPropertyValues("board.forbidden-words.ignore-case=true",
                        "board.jwt.secret=0123456789abcdef0123456789abcdef", "board.jwt.expires-in-seconds=3600")
                .run(ctx -> {
                    assertThat(ctx).hasNotFailed();
                    assertThat(ctx.getBean(BoardProperties.class).forbiddenWords().ignoreCase()).isTrue();
                });
    }

    @Test
    void 필수_값을_비우면_기동이_실패한다() {
        runner.run(ctx -> assertThat(ctx).hasFailed());
    }
}
