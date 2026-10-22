package com.example.board;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
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
}
