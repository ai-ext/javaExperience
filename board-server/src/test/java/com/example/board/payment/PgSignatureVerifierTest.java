package com.example.board.payment;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PgSignatureVerifierTest {

    static final String SECRET = "test-only-pg-secret-test-only-pg-secret";
    final PgSignatureVerifier verifier = new PgSignatureVerifier(SECRET);
    final byte[] body = "{\"orderId\":\"CHG-1\",\"paymentKey\":\"pk-1\",\"status\":\"DONE\",\"amount\":1000}"
            .getBytes(StandardCharsets.UTF_8);

    @Test
    void 원문_바이트의_HMAC_SHA256_소문자_16진수면_통과() {
        assertThat(verifier.verify(body, PgSignatures.sign(SECRET, body))).isTrue();
    }

    @Test
    void 본문이_한_바이트라도_다르면_실패() {
        String signature = PgSignatures.sign(SECRET, body);
        byte[] tampered = new String(body, StandardCharsets.UTF_8).replace("1000", "9000")
                .getBytes(StandardCharsets.UTF_8);

        assertThat(verifier.verify(tampered, signature)).isFalse();
    }

    @Test
    void 다른_키로_만든_서명_대문자_서명_빈_서명은_실패() {
        assertThat(verifier.verify(body, PgSignatures.sign("other-secret-other-secret-other-secret", body))).isFalse();
        assertThat(verifier.verify(body, PgSignatures.sign(SECRET, body).toUpperCase())).isFalse();
        assertThat(verifier.verify(body, null)).isFalse();
        assertThat(verifier.verify(body, "")).isFalse();
    }
}
