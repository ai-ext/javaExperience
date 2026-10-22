package com.example.board.payment;

import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.UnknownHostException;

import org.apache.hc.client5.http.ConnectTimeoutException;
import org.apache.hc.core5.http.ConnectionRequestTimeoutException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/** 외부 PG 호출. DB 트랜잭션 안에서 부르지 않는다(spec-v2 §8). */
public class PgClient {

    private final RestClient restClient;

    public PgClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public PgApproval approve(String orderId, int amount, String idempotencyKey) {
        try {
            return restClient.post()
                    .uri("/pg/v1/payments")
                    .header("Idempotency-Key", idempotencyKey)
                    .body(new ApproveRequest(orderId, amount))
                    .retrieve()
                    .body(PgApproval.class);
        } catch (RuntimeException e) {
            throw translate(e);
        }
    }

    private record ApproveRequest(String orderId, int amount) {
    }

    static PgException translate(RuntimeException e) {
        if (e instanceof HttpServerErrorException) {
            return new PgException(PgException.Kind.SERVER_ERROR, "PG 서버 오류", e);
        }
        if (e instanceof HttpClientErrorException) {
            return new PgException(PgException.Kind.DECLINED, "PG 승인 거절", e);
        }
        if (e instanceof ResourceAccessException) {
            Throwable cause = e.getCause();
            if (cause instanceof ConnectionRequestTimeoutException) {
                return new PgException(PgException.Kind.POOL_TIMEOUT, "PG 커넥션 풀 대기 시간 초과", e);
            }
            if (cause instanceof ConnectException || cause instanceof ConnectTimeoutException
                    || cause instanceof NoRouteToHostException || cause instanceof UnknownHostException) {
                return new PgException(PgException.Kind.UNREACHABLE, "PG 연결 실패", e);
            }
            // 응답 타임아웃과 응답 도중 끊김은 모두 결과 불명이다
            return new PgException(PgException.Kind.TIMEOUT, "PG 응답 없음", e);
        }
        throw e;
    }
}
