package com.example.board.payment;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.security.test.context.support.WithMockUser;

import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WithMockUser
class PgCallbackApiTest extends PgApiTestSupport {

    @Autowired
    PgPaymentRepository paymentRepository;

    @Autowired
    TransactionTemplate tx;

    /** 시간 초과로 결과 불명이 된 충전 기록을 바로 만든다. */
    PgPayment unknownCharge(Member m, int amount) {
        PgPayment p = paymentRepository.saveAndFlush(PgPayment.request(m, amount, newKey(), LocalDateTime.now()));
        tx.executeWithoutResult(s -> paymentRepository.markUnknown(p.getId(), LocalDateTime.now()));
        return p;
    }

    String statusOf(PgPayment p) {
        return jdbc.queryForObject("SELECT status FROM pg_payment WHERE id = ?", String.class, p.getId());
    }

    @Test
    void 서명이_맞으면_200이고_UNKNOWN이_DONE이_되며_한_번_적립한다() throws Exception {
        Member m = newMember(Role.USER);
        PgPayment p = unknownCharge(m, 7000);

        // 인증 헤더 없이 서명만으로 통과한다
        signedCallback(callbackBody(p.getOrderId(), "DONE", 7000)).andExpect(status().isOk());

        assertThat(statusOf(p)).isEqualTo("DONE");
        assertThat(balance(m)).isEqualTo(7000);
        assertThat(chargeLedgers(m)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT payment_key FROM pg_payment WHERE id = ?", String.class, p.getId()))
                .isEqualTo("pk-" + p.getOrderId());
    }

    @Test
    void 같은_paymentKey_콜백을_다시_받아도_200이고_잔액은_그대로() throws Exception {
        Member m = newMember(Role.USER);
        PgPayment p = unknownCharge(m, 7000);
        String body = callbackBody(p.getOrderId(), "DONE", 7000);
        signedCallback(body).andExpect(status().isOk());

        signedCallback(body).andExpect(status().isOk());

        assertThat(balance(m)).isEqualTo(7000);
        assertThat(chargeLedgers(m)).isEqualTo(1);
    }

    @Test
    void 서명이_틀리거나_없으면_401() throws Exception {
        Member m = newMember(Role.USER);
        PgPayment p = unknownCharge(m, 7000);
        String body = callbackBody(p.getOrderId(), "DONE", 7000);

        callback(body, PgSignatures.sign("wrong-secret-wrong-secret-wrong-secret", body.getBytes()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("/errors/invalid-signature"));
        callback(body, null)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("/errors/invalid-signature"));

        assertThat(statusOf(p)).isEqualTo("UNKNOWN");
        assertThat(balance(m)).isZero();
    }

    @Test
    void 서명은_원문_바이트로_확인한다_공백과_필드_순서가_달라도_통과() throws Exception {
        Member m = newMember(Role.USER);
        PgPayment p = unknownCharge(m, 7000);
        String raw = "{ \"amount\" : 7000,\n  \"status\":\"DONE\", \"paymentKey\":\"pk-" + p.getOrderId()
                + "\", \"orderId\":\"" + p.getOrderId() + "\" }";

        signedCallback(raw).andExpect(status().isOk());

        assertThat(statusOf(p)).isEqualTo("DONE");
    }

    @Test
    void 없는_orderId면_404() throws Exception {
        signedCallback(callbackBody("CHG-00000000-0000-0000-0000-000000000000", "DONE", 7000))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("/errors/not-found"));
    }

    @Test
    void 금액이_저장된_충전_금액과_다르면_400이고_상태는_그대로() throws Exception {
        Member m = newMember(Role.USER);
        PgPayment p = unknownCharge(m, 7000);

        signedCallback(callbackBody(p.getOrderId(), "DONE", 70000))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));

        assertThat(statusOf(p)).isEqualTo("UNKNOWN");
        assertThat(balance(m)).isZero();
    }

    @Test
    void 필드_규칙을_어기면_400_errors() throws Exception {
        Member m = newMember(Role.USER);
        PgPayment p = unknownCharge(m, 7000);

        signedCallback(callbackBody(p.getOrderId(), "CANCELED", 7000))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"))
                .andExpect(jsonPath("$.errors[0].field").value("status"));
        signedCallback("not-json")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
    }

    @Test
    void FAILED_콜백이면_FAILED이고_적립하지_않는다() throws Exception {
        Member m = newMember(Role.USER);
        PgPayment p = unknownCharge(m, 7000);

        signedCallback(callbackBody(p.getOrderId(), "FAILED", 7000)).andExpect(status().isOk());

        assertThat(statusOf(p)).isEqualTo("FAILED");
        assertThat(balance(m)).isZero();
    }
}
