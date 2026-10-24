package com.example.board.tickets;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B13 확인: PG 서버가 보내는 결제 완료 콜백(POST /api/pg/callbacks)은 JWT 없이 서명(X-PG-Signature)만으로 처리된다.
 * 서명이 맞으면 200이고 충전이 확정되며, 서명이 틀리거나 없으면 401 /errors/invalid-signature(인증 필터의 401과 다른 응답)다.
 */
class B13ConfirmTest extends ApiTestSupport {

    @Value("${board.pg.secret}")
    String pgSecret;

    /** 승인 응답을 못 받아 결과 불명(UNKNOWN)으로 남은 충전 기록을 바로 만든다. */
    String unknownCharge(Member m, int amount) {
        String orderId = "b13-" + UUID.randomUUID().toString().substring(0, 18);
        jdbc.update("INSERT INTO pg_payment (member_id, order_id, amount, status, idempotency_key, requested_at,"
                + " created_at, updated_at) VALUES (?, ?, ?, 'UNKNOWN', ?, NOW(6), NOW(6), NOW(6))",
                m.getId(), orderId, amount, UUID.randomUUID().toString());
        return orderId;
    }

    static String body(String orderId, int amount) {
        return "{\"orderId\":\"" + orderId + "\",\"paymentKey\":\"pk-" + orderId + "\",\"status\":\"DONE\",\"amount\":"
                + amount + "}";
    }

    MockHttpServletResponse callback(String rawBody, String signature) throws Exception {
        var req = post("/api/pg/callbacks").contentType(MediaType.APPLICATION_JSON)
                .content(rawBody.getBytes(StandardCharsets.UTF_8));
        if (signature != null) {
            req = req.header("X-PG-Signature", signature);
        }
        return mockMvc.perform(req).andReturn().getResponse();
    }

    static String sign(String secret, String rawBody) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    String status(String orderId) {
        return jdbc.queryForObject("SELECT status FROM pg_payment WHERE order_id = ?", String.class, orderId);
    }

    long balance(Member m) {
        return jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId());
    }

    @Test
    void 토큰_없이_서명이_맞는_콜백은_200이고_충전이_확정된다() throws Exception {
        Member m = newMember(Role.USER);
        String orderId = unknownCharge(m, 7000);
        String raw = body(orderId, 7000);

        MockHttpServletResponse r = callback(raw, sign(pgSecret, raw));

        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(status(orderId)).isEqualTo("DONE");
        assertThat(balance(m)).isEqualTo(7000);
    }

    @Test
    void 서명이_틀리면_401_invalid_signature이고_상태는_그대로다() throws Exception {
        Member m = newMember(Role.USER);
        String orderId = unknownCharge(m, 7000);
        String raw = body(orderId, 7000);

        MockHttpServletResponse r = callback(raw, sign("wrong-secret-wrong-secret-wrong-secret", raw));

        assertThat(r.getStatus()).isEqualTo(401);
        assertThat(r.getContentAsString()).contains("/errors/invalid-signature");
        assertThat(status(orderId)).isEqualTo("UNKNOWN");
        assertThat(balance(m)).isZero();
    }

    @Test
    void 서명이_없어도_401_invalid_signature다() throws Exception {
        Member m = newMember(Role.USER);
        String orderId = unknownCharge(m, 7000);

        MockHttpServletResponse r = callback(body(orderId, 7000), null);

        assertThat(r.getStatus()).isEqualTo(401);
        assertThat(r.getContentAsString()).contains("/errors/invalid-signature");
        assertThat(status(orderId)).isEqualTo("UNKNOWN");
    }
}
