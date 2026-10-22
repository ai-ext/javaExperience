package com.example.board;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.ServerSocket;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.mysql.MySQLContainer;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfig {

    @Bean
    @ServiceConnection
    MySQLContainer mysqlContainer() {
        // 한글 금칙어·닉네임이 깨지지 않도록 서버 문자셋을 고정한다
        return new MySQLContainer("mysql:8.4")
                .withCommand("--character-set-server=utf8mb4", "--collation-server=utf8mb4_0900_ai_ci");
    }

    // PG 모의는 JVM에 하나만 띄우고, 서버는 Toxiproxy 주소로 부른다
    @Bean
    DynamicPropertyRegistrar pgProperties() {
        return registry -> registry.add("board.pg.base-url", PgContainers::baseUrl);
    }

    /**
     * Redis도 JVM에 하나만 띄운다. 컨텍스트마다 MySQL은 따로라 키가 섞이지 않게 Redis 테스트는 시작할 때 비운다.
     * test.redis.route: direct(기본) = Redis에 바로, proxy = Toxiproxy 경유(지연 주입용), dead = 아무도 안 듣는 포트(연결 거부).
     */
    @Bean
    DynamicPropertyRegistrar redisProperties(Environment env) {
        String route = env.getProperty("test.redis.route", "direct");
        return registry -> {
            switch (route) {
                case "proxy" -> {
                    registry.add("spring.data.redis.host", RedisContainers::proxyHost);
                    registry.add("spring.data.redis.port", RedisContainers::proxyPort);
                }
                case "dead" -> {
                    int port = unusedPort();
                    registry.add("spring.data.redis.host", () -> "localhost");
                    registry.add("spring.data.redis.port", () -> port);
                }
                default -> {
                    registry.add("spring.data.redis.host", RedisContainers::host);
                    registry.add("spring.data.redis.port", RedisContainers::port);
                }
            }
        };
    }

    private static int unusedPort() {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
