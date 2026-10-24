package com.example.board.tickets;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MvcResult;

import com.example.board.ApiTestSupport;
import com.example.board.PgContainers;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;

import eu.rekawek.toxiproxy.model.ToxicDirection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B01 확인 테스트: PG가 느려 충전 요청이 몰려도 충전과 상관없는 글 목록은 평소처럼 응답한다.
 *
 * <p>Hikari 풀은 10개(커넥션 대기 상한 2초)다. PG 응답을 6초 늦추고, 이 테스트에서만 PG 응답 타임아웃을 10초로 늘려
 * 충전들이 6초 동안 PG 응답을 기다리게 한다(타임아웃·재시도와 섞이지 않게). 충전 12건이 PG에 닿아 응답을 기다리는 동안
 * GET /api/posts가 1.5초 안에 200이어야 한다. 판정이 그 대기 구간 안에서 이뤄졌는지(PG에 닿은 충전이 아직 안 끝났는지)와
 * 충전이 끝내 성공했는지도 확인한다. PG 호출 수를 제한하는 수정(벌크헤드 등)도 통과할 수 있게 "12건 모두 PG에 닿음"은 요구하지 않는다.
 */
@TestPropertySource(properties = "board.pg.response-timeout=10s")
class B01ConfirmTest extends ApiTestSupport {

    private static final int CHARGES = 12;
    private static final int PG_LATENCY_MILLIS = 6000;

    @Autowired
    DataSource dataSource;

    @AfterEach
    void resetPg() {
        PgContainers.reset();
    }

    @Test
    void PG가_6초_늦어_충전이_몰려도_글_목록은_곧바로_200이다() throws Exception {
        List<Member> members = new ArrayList<>();
        for (int i = 0; i < CHARGES; i++) {
            members.add(newMember(Role.USER));
        }
        // 예열: 첫 요청의 클래스 로딩 시간을 측정에서 뺀다
        mockMvc.perform(get("/api/posts")).andReturn();
        HikariPoolMXBean hikari = dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean();

        PgContainers.proxy().toxics().latency("pg-latency", ToxicDirection.DOWNSTREAM, PG_LATENCY_MILLIS);
        ExecutorService pool = Executors.newFixedThreadPool(CHARGES);
        List<Future<MvcResult>> charges = new ArrayList<>();
        try {
            for (Member m : members) {
                charges.add(pool.submit(() -> mockMvc.perform(post("/api/me/points/charges")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":5000}")
                        .header("Authorization", bearer(m))
                        .header("Idempotency-Key", UUID.randomUUID().toString())).andReturn()));
            }
            int reachedPg = waitForPgRequests();
            int active = hikari.getActiveConnections();
            int waiting = hikari.getThreadsAwaitingConnection();
            require(reachedPg > 0, "충전 요청이 PG에 하나도 닿지 않았다(부하가 걸리지 않음)");

            long start = System.nanoTime();
            int status = mockMvc.perform(get("/api/posts")).andReturn().getResponse().getStatus();
            long elapsedMillis = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
            long stillWaiting = charges.stream().filter(f -> !f.isDone()).count();

            require(stillWaiting >= reachedPg, "글 목록을 부르는 동안 PG에 닿은 충전 %d건이 아직 PG 응답을 기다리는 중이어야 한다(미완료 %d건)"
                    .formatted(reachedPg, stillWaiting));
            String load = "PG에 닿은 충전 %d건, 측정 직전 Hikari 사용 중 %d·커넥션 대기 %d".formatted(reachedPg, active, waiting);
            assertThat(status).as("PG 지연 중 GET /api/posts 응답 코드(%s)", load).isEqualTo(200);
            assertThat(elapsedMillis).as("PG 지연 중 GET /api/posts 응답 시간 ms(%s)", load).isLessThan(1500);

            // 충전 자체도 망가지면 안 된다: PG에 닿은 충전은 PG 응답(6초 뒤 승인)을 받아 성공(2xx)하고, 서버 오류(500)는 없다
            List<Integer> chargeStatuses = new ArrayList<>();
            for (Future<MvcResult> f : charges) {
                chargeStatuses.add(f.get(30, TimeUnit.SECONDS).getResponse().getStatus());
            }
            assertThat(chargeStatuses).as("충전 응답 코드").doesNotContain(500);
            assertThat(chargeStatuses.stream().filter(s -> s / 100 == 2).count())
                    .as("성공한 충전 수(PG에 닿은 %d건 이상), 응답 코드 %s", reachedPg, chargeStatuses)
                    .isGreaterThanOrEqualTo(reachedPg);
        } finally {
            // 다음 테스트가 바닥난 풀을 물려받지 않게 충전 요청이 모두 끝날 때까지 기다린다
            pool.shutdown();
            pool.awaitTermination(30, TimeUnit.SECONDS);
        }
    }

    /** 준비 조건. 단언 실패(결함 증상)와 구분되도록 단언이 아닌 예외로 끝낸다. */
    private static void require(boolean ok, String message) {
        if (!ok) {
            throw new IllegalStateException("준비 실패: " + message);
        }
    }

    /**
     * PG가 받은 승인 요청 수가 충전 수에 이르거나, 1건 이상에서 0.3초 동안 늘지 않을 때까지(최대 2초) 기다린다.
     * 충전의 PG 대기(6초)보다 훨씬 짧아 측정이 대기 구간 안에 들어간다.
     */
    private static int waitForPgRequests() throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
        int last = -1;
        long stableSince = System.nanoTime();
        while (System.nanoTime() < deadline) {
            int n = PgContainers.approveRequestCount();
            if (n >= CHARGES) {
                return n;
            }
            if (n != last) {
                last = n;
                stableSince = System.nanoTime();
            } else if (n > 0 && System.nanoTime() - stableSince > TimeUnit.MILLISECONDS.toNanos(300)) {
                return n;
            }
            Thread.sleep(20);
        }
        return PgContainers.approveRequestCount();
    }
}
