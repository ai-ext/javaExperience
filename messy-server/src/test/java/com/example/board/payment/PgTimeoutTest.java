package com.example.board.payment;

import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.PgContainers;
import com.example.board.member.Member;
import com.example.board.member.Role;

import eu.rekawek.toxiproxy.model.ToxicDirection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PgTimeoutTest extends PgApiTestSupport {

    @Autowired
    ChargeService chargeService;

    /** Toxiproxy로 PG 응답을 5초 늦추고 충전한다. 끝나면 지연을 걷는다. */
    String chargeWithSlowPg(Member m, int amount) throws Exception {
        String key = newKey();
        PgContainers.proxy().toxics().latency("pg-latency", ToxicDirection.DOWNSTREAM, 5000);
        long start = System.nanoTime();

        charge(m, key, amount)
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.type").value("/errors/pg-timeout"));

        // 3초 응답 타임아웃이 끊었다는 증거로 하한도 본다(빠른 실패였다면 3초 미만). 상한은 JVM 예열 여유를 둔다.
        assertThat(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start)).isBetween(3000L, 4499L);
        PgContainers.healProxy();
        return key;
    }

    @Test
    void PG가_5초_늦으면_3초_타임아웃으로_504이고_UNKNOWN이며_재시도하지_않는다() throws Exception {
        Member m = newMember(Role.USER);

        String key = chargeWithSlowPg(m, 7000);

        assertThat(paymentStatus(key)).isEqualTo("UNKNOWN");
        assertThat(balance(m)).isZero();
        assertThat(PgContainers.approveIdempotencyKeys()).containsExactly(key);
    }

    @Test
    void UNKNOWN은_orderId_조회로_DONE이_되고_적립은_한_번이다() throws Exception {
        Member m = newMember(Role.USER);
        String key = chargeWithSlowPg(m, 7000);
        String orderId = orderId(key);
        PgContainers.stubLookupDone(orderId, 7000);

        assertThat(chargeService.reconcile(orderId)).isEqualTo(PgPaymentStatus.DONE);
        assertThat(chargeService.reconcile(orderId)).isEqualTo(PgPaymentStatus.DONE);

        assertThat(paymentStatus(key)).isEqualTo("DONE");
        assertThat(balance(m)).isEqualTo(7000);
        assertThat(chargeLedgers(m)).isEqualTo(1);
        // 확정된 뒤 같은 키로 다시 보내면 처음 결과(DONE)를 돌려준다
        charge(m, key, 7000).andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("DONE"));
        assertThat(balance(m)).isEqualTo(7000);
    }

    @Test
    void UNKNOWN은_서명된_콜백_하나로_DONE이_되고_적립은_한_번이다() throws Exception {
        Member m = newMember(Role.USER);
        String key = chargeWithSlowPg(m, 7000);
        String orderId = orderId(key);

        signedCallback(callbackBody(orderId, "DONE", 7000)).andExpect(status().isOk());
        // 콜백 뒤에 재처리 워커가 조회해도 다시 적립하지 않는다
        PgContainers.stubLookupDone(orderId, 7000);
        chargeService.reconcile(orderId);

        assertThat(paymentStatus(key)).isEqualTo("DONE");
        assertThat(balance(m)).isEqualTo(7000);
        assertThat(chargeLedgers(m)).isEqualTo(1);
    }

    @Test
    void 확정_전에_같은_키로_다시_보내면_PG를_다시_부르지_않고_504() throws Exception {
        Member m = newMember(Role.USER);
        String key = chargeWithSlowPg(m, 7000);

        charge(m, key, 7000).andExpect(status().isGatewayTimeout());

        assertThat(PgContainers.approveRequestCount()).isEqualTo(1);
        assertThat(paymentStatus(key)).isEqualTo("UNKNOWN");
    }

    @Test
    void PG_조회에_결과가_없으면_UNKNOWN을_그대로_둔다() throws Exception {
        Member m = newMember(Role.USER);
        String key = chargeWithSlowPg(m, 7000);

        // 조회 스텁이 없으면 WireMock은 404다
        assertThat(chargeService.reconcile(orderId(key))).isEqualTo(PgPaymentStatus.UNKNOWN);
        assertThat(balance(m)).isZero();
    }
}
