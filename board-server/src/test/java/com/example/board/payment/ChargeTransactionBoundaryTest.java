package com.example.board.payment;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;

import com.example.board.PgContainers;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;

import static org.assertj.core.api.Assertions.assertThat;

class ChargeTransactionBoundaryTest extends PgApiTestSupport {

    @Autowired
    DataSource dataSource;

    @Test
    void PG를_기다리는_동안_DB_커넥션을_쥐지_않는다() throws Exception {
        PgContainers.stubApproveDelay(1500);
        HikariPoolMXBean pool = dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean();
        Member m = newMember(Role.USER);
        String key = newKey();

        CompletableFuture<MvcResult> inFlight = CompletableFuture.supplyAsync(() -> {
            try {
                return charge(m, key, 5000).andReturn();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        });
        // PG가 요청을 받은 뒤(= 지연 구간)부터 활성 커넥션 수를 잰다
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(3);
        while (PgContainers.approveRequestCount() == 0 && System.nanoTime() < deadline) {
            Thread.onSpinWait();
        }
        int maxActive = 0;
        for (int i = 0; i < 10; i++) {
            maxActive = Math.max(maxActive, pool.getActiveConnections());
            Thread.sleep(50);
        }

        assertThat(inFlight.get(5, TimeUnit.SECONDS).getResponse().getStatus()).isEqualTo(201);
        assertThat(PgContainers.approveRequestCount()).isEqualTo(1);
        assertThat(maxActive).as("PG 지연 중 Hikari active").isZero();
    }
}
