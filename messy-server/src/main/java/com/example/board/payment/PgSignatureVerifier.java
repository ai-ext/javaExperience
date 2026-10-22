package com.example.board.payment;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/** X-PG-Signature = 본문 원문 바이트의 HMAC-SHA256, 16진 소문자(spec-v2 §7). */
public class PgSignatureVerifier {

    private static final String ALGORITHM = "HmacSHA256";

    private final SecretKeySpec key;

    public PgSignatureVerifier(String secret) {
        this.key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM);
    }

    /** 반드시 파싱 전 원문으로 부른다. 파싱 후 다시 직렬화하면 공백·필드 순서가 바뀌어 바이트가 달라진다. */
    public boolean verify(byte[] rawBody, String signatureHex) {
        if (signatureHex == null || signatureHex.isEmpty()) {
            return false;
        }
        byte[] expected = HexFormat.of().formatHex(hmac(rawBody)).getBytes(StandardCharsets.US_ASCII);
        // equals는 첫 불일치에서 멈춰 응답 시간으로 서명을 한 글자씩 추측할 수 있다. 상수 시간 비교를 쓴다.
        return MessageDigest.isEqual(expected, signatureHex.getBytes(StandardCharsets.US_ASCII));
    }

    private byte[] hmac(byte[] body) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(key);
            return mac.doFinal(body);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
