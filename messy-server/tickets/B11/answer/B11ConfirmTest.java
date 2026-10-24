package com.example.board.tickets;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.Banner;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * B11 확인: 운영 서버와 같은 환경 변수(deploy/board.env)로 기동했을 때 실제로 쓰이는 JWT 만료가
 * 운영팀이 application-prod.yml에 적은 30분(1800초)이다. 로컬은 기본값(3600초) 그대로다.
 * 빈은 만들지 않고 설정 파일·환경 변수·프로파일을 Spring Boot와 같은 순서로 합친 결과만 본다.
 */
class B11ConfirmTest {

    private static final Path DEPLOY_ENV = Path.of("deploy/board.env");
    private static final String KEY = "board.jwt.expires-in-seconds";

    @Configuration(proxyBeanMethods = false)
    static class NoBeans {
    }

    @Test
    void 운영_배포_환경_변수로_띄우면_토큰_만료는_1800초다() throws IOException {
        long effective = effectiveValue(readEnvFile(DEPLOY_ENV), "prod");

        assertThat(effective).as("운영에서 실제로 쓰이는 %s", KEY).isEqualTo(1800L);
    }

    @Test
    void 환경_변수가_없는_로컬은_기본값_3600초다() {
        long effective = effectiveValue(Map.of(), "local");

        assertThat(effective).isEqualTo(3600L);
    }

    /** 운영 서버의 OS 환경 변수 자리에 파일 내용을 넣고 기동해, 바인딩에 실제로 쓰이는 값을 읽는다. */
    private static long effectiveValue(Map<String, Object> osEnv, String profile) {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().replace(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                new SystemEnvironmentPropertySource(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, osEnv));
        try (ConfigurableApplicationContext ctx = new SpringApplicationBuilder(NoBeans.class)
                .web(WebApplicationType.NONE)
                .bannerMode(Banner.Mode.OFF)
                .logStartupInfo(false)
                .environment(env)
                .profiles(profile)
                .run()) {
            ConfigurableEnvironment resolved = ctx.getEnvironment();
            return Binder.get(resolved).bind(KEY, Long.class).get();
        }
    }

    /** systemd EnvironmentFile 형식(KEY=VALUE, # 주석, 빈 줄)을 읽는다. */
    private static Map<String, Object> readEnvFile(Path file) throws IOException {
        assertThat(file).as("운영 환경 변수 파일").exists();
        Map<String, Object> vars = new LinkedHashMap<>();
        for (String line : Files.readAllLines(file, StandardCharsets.UTF_8)) {
            String trimmed = line.strip();
            if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                continue;
            }
            int eq = trimmed.indexOf('=');
            String value = trimmed.substring(eq + 1).strip();
            if (value.length() >= 2 && (value.startsWith("\"") && value.endsWith("\"")
                    || value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length() - 1);
            }
            vars.put(trimmed.substring(0, eq).strip(), value);
        }
        return vars;
    }
}
