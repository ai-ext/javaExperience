package com.example.board.tickets;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import com.example.board.ApiTestSupport;
import com.example.board.PgContainers;
import com.example.board.member.Member;
import com.example.board.member.Role;

import eu.rekawek.toxiproxy.model.ToxicDirection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B01 확인 테스트: PG가 느려 충전 요청이 몰려도 충전과 상관없는 글 목록은 평소처럼 응답한다.
 * Hikari 풀은 10개다. 충전 12건이 PG 응답을 기다리는 동안 GET /api/posts가 1초 안에 200이어야 한다.
 */
class B01ConfirmTest extends ApiTestSupport {

    private static final int CHARGES = 12;

    @AfterEach
    void resetPg() {
        PgContainers.reset();
    }

    @Test
    void PG가_5초_늦어_충전이_몰려도_글_목록은_1초_안에_200이다() throws Exception {
        List<Member> members = new ArrayList<>();
        for (int i = 0; i < CHARGES; i++) {
            members.add(newMember(Role.USER));
        }
        // 예열: 첫 요청의 클래스 로딩 시간을 측정에서 뺀다
        mockMvc.perform(get("/api/posts")).andReturn();

        PgContainers.proxy().toxics().latency("pg-latency", ToxicDirection.DOWNSTREAM, 5000);
        ExecutorService pool = Executors.newFixedThreadPool(CHARGES);
        List<Future<MvcResult>> charges = new ArrayList<>();
        try {
            for (Member m : members) {
                charges.add(pool.submit(() -> mockMvc.perform(post("/api/me/points/charges")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":5000}")
                        .header("Authorization", bearer(m))
                        .header("Idempotency-Key", UUID.randomUUID().toString())).andReturn()));
            }
            // PG가 충전 요청을 10건 이상 받을 때까지(= 충전들이 PG 응답을 기다리는 구간) 최대 3초 기다린 뒤 글 목록을 부른다.
            // PG 호출 수를 제한하는 수정(벌크헤드 등)이면 10건에 못 미칠 수 있어 단언하지 않는다.
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(3);
            while (PgContainers.approveRequestCount() < 10 && System.nanoTime() < deadline) {
                Thread.sleep(20);
            }

            long start = System.nanoTime();
            int status = mockMvc.perform(get("/api/posts")).andReturn().getResponse().getStatus();
            long elapsedMillis = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);

            assertThat(status).as("PG 지연 중 GET /api/posts 응답 코드").isEqualTo(200);
            assertThat(elapsedMillis).as("PG 지연 중 GET /api/posts 응답 시간(ms)").isLessThan(1000);
        } finally {
            // 다음 테스트가 바닥난 풀을 물려받지 않게 충전 요청이 모두 끝날 때까지 기다린다
            pool.shutdown();
            pool.awaitTermination(20, TimeUnit.SECONDS);
        }
    }
}
