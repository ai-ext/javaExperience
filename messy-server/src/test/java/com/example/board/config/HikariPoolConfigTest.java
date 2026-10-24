package com.example.board.config;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.zaxxer.hikari.HikariDataSource;

import static org.assertj.core.api.Assertions.assertThat;

class HikariPoolConfigTest extends ApiTestSupport {

    @Autowired
    DataSource dataSource;

    @Test
    void 실행_중인_풀은_명세_운영_값을_쓴다() throws Exception {
        HikariDataSource hikari = dataSource.unwrap(HikariDataSource.class);

        // spec-v2 §8: maximum-pool-size 10, connection-timeout 2000ms
        assertThat(hikari.getMaximumPoolSize()).isEqualTo(10);
        assertThat(hikari.getConnectionTimeout()).isEqualTo(2000L);
    }
}
