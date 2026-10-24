package com.example.board.payment;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import com.example.board.ApiTestSupport;
import com.example.board.PgContainers;
import com.example.board.member.Member;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** 충전·콜백 테스트 공통. 테스트마다 PG 모의의 지연·임시 스텁·요청 기록을 지운다. */
abstract class PgApiTestSupport extends ApiTestSupport {

    @Value("${board.pg.secret}")
    String pgSecret;

    @AfterEach
    void resetPg() {
        PgContainers.reset();
    }

    String newKey() {
        return UUID.randomUUID().toString();
    }

    ResultActions charge(Member m, String key, int amount) throws Exception {
        return charge(m, key, "{\"amount\":" + amount + "}");
    }

    ResultActions charge(Member m, String key, String body) throws Exception {
        var req = post("/api/me/points/charges").contentType(MediaType.APPLICATION_JSON).content(body)
                .header("Authorization", bearer(m));
        if (key != null) {
            req = req.header("Idempotency-Key", key);
        }
        return mockMvc.perform(req);
    }

    /** PG가 보내는 것처럼 원문 바이트에 서명해 콜백을 보낸다. 인증 헤더는 없다. */
    ResultActions callback(String rawBody, String signature) throws Exception {
        var req = post("/api/pg/callbacks").contentType(MediaType.APPLICATION_JSON)
                .content(rawBody.getBytes(StandardCharsets.UTF_8));
        if (signature != null) {
            req = req.header("X-PG-Signature", signature);
        }
        return mockMvc.perform(req);
    }

    ResultActions signedCallback(String rawBody) throws Exception {
        return callback(rawBody, PgSignatures.sign(pgSecret, rawBody.getBytes(StandardCharsets.UTF_8)));
    }

    static String callbackBody(String orderId, String status, int amount) {
        return "{\"orderId\":\"" + orderId + "\",\"paymentKey\":\"pk-" + orderId + "\",\"status\":\"" + status
                + "\",\"amount\":" + amount + "}";
    }

    long balance(Member m) {
        return jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId());
    }

    int chargeLedgers(Member m) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM point_ledger WHERE member_id = ? AND type = 'CHARGE'",
                Integer.class, m.getId());
    }

    String paymentStatus(String key) {
        return jdbc.queryForObject("SELECT status FROM pg_payment WHERE idempotency_key = ?", String.class, key);
    }

    String orderId(String key) {
        return jdbc.queryForObject("SELECT order_id FROM pg_payment WHERE idempotency_key = ?", String.class, key);
    }
}
