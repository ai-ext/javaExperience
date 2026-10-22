package com.example.board.payment;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

import com.example.board.PgContainers;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PgCallbackOrderingTest extends PgApiTestSupport {

    @Test
    void 콜백이_승인_응답보다_먼저_와도_적립은_한_번이고_최종_DONE() throws Exception {
        PgContainers.stubApproveDelay(1500);
        Member m = newMember(Role.USER);
        String key = newKey();

        CompletableFuture<MvcResult> inFlight = CompletableFuture.supplyAsync(() -> {
            try {
                return charge(m, key, 9000).andReturn();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        });
        // PG가 승인 요청을 받았지만 아직 응답하지 않은 구간에 콜백을 보낸다
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(3);
        while (PgContainers.approveRequestCount() == 0 && System.nanoTime() < deadline) {
            Thread.onSpinWait();
        }
        String orderId = orderId(key);
        signedCallback(callbackBody(orderId, "DONE", 9000)).andExpect(status().isOk());
        assertThat(inFlight.isDone()).as("콜백이 승인 응답보다 먼저 처리됐다").isFalse();
        assertThat(balance(m)).isEqualTo(9000);

        MvcResult result = inFlight.get(5, TimeUnit.SECONDS);

        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        assertThat(result.getResponse().getContentAsString()).contains("\"status\":\"DONE\"");
        assertThat(paymentStatus(key)).isEqualTo("DONE");
        assertThat(balance(m)).isEqualTo(9000);
        assertThat(chargeLedgers(m)).isEqualTo(1);
    }

    @Test
    void 승인_응답_뒤에_온_콜백은_적립하지_않는다() throws Exception {
        Member m = newMember(Role.USER);
        String key = newKey();
        charge(m, key, 9000).andExpect(status().isCreated());

        signedCallback(callbackBody(orderId(key), "DONE", 9000)).andExpect(status().isOk());

        assertThat(balance(m)).isEqualTo(9000);
        assertThat(chargeLedgers(m)).isEqualTo(1);
    }
}
