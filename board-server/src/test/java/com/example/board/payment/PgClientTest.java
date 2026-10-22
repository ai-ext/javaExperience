package com.example.board.payment;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.example.board.PgContainers;
import com.example.board.config.BoardProperties;
import com.example.board.config.PgClientConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class PgClientTest {

    @BeforeAll
    static void up() {
        PgContainers.start();
    }

    @AfterEach
    void reset() {
        PgContainers.reset();
    }

    PgClient client(String baseUrl, int maxConnections) {
        BoardProperties.Pg pg = new BoardProperties.Pg(baseUrl, Duration.ofSeconds(1), Duration.ofSeconds(3),
                Duration.ofSeconds(2), maxConnections);
        return new PgClient(PgClientConfig.pgRestClient(pg));
    }

    String orderId() {
        return "CHG-" + UUID.randomUUID();
    }

    void delayApprove(int millis) {
        PgContainers.stub("""
                {"priority":1,"request":{"method":"POST","urlPath":"/pg/v1/payments"},
                 "response":{"status":200,"fixedDelayMilliseconds":%d,"headers":{"Content-Type":"application/json"},
                  "jsonBody":{"paymentKey":"pk-slow","status":"DONE","amount":1000}}}
                """.formatted(millis));
    }

    @Test
    void 승인_응답을_PgApproval로_받는다() {
        String orderId = orderId();

        PgApproval approval = client(PgContainers.baseUrl(), 10).approve(orderId, 5000, "key-" + orderId);

        assertThat(approval.paymentKey()).isEqualTo("pk-" + orderId);
        assertThat(approval.status()).isEqualTo(PgApproval.Status.DONE);
        assertThat(approval.amount()).isEqualTo(5000);
        assertThat(PgContainers.approveIdempotencyKeys()).containsExactly("key-" + orderId);
    }

    @Test
    void 응답이_4초_걸리면_3초에_응답_타임아웃() {
        delayApprove(4000);
        long start = System.nanoTime();

        PgException e = catchThrowableOfType(PgException.class,
                () -> client(PgContainers.baseUrl(), 10).approve(orderId(), 1000, "key-timeout-1"));

        long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        assertThat(e.kind()).isEqualTo(PgException.Kind.TIMEOUT);
        assertThat(elapsed).isBetween(2900L, 3800L);
    }

    @Test
    void 닫힌_포트는_1초_안에_연결_실패() {
        long start = System.nanoTime();

        PgException e = catchThrowableOfType(PgException.class,
                () -> client("http://127.0.0.1:1", 10).approve(orderId(), 1000, "key-closed-1"));

        long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        assertThat(e.kind()).isEqualTo(PgException.Kind.UNREACHABLE);
        assertThat(elapsed).isLessThan(1000L);
    }

    @Test
    void SYN에_답이_없는_주소는_1초에_연결_타임아웃() {
        long start = System.nanoTime();

        // 10.255.255.1은 라우팅되지만 아무도 응답하지 않아 SYN이 버려진다
        PgException e = catchThrowableOfType(PgException.class,
                () -> client("http://10.255.255.1:81", 10).approve(orderId(), 1000, "key-blackhole-1"));

        long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        assertThat(e.kind()).isEqualTo(PgException.Kind.UNREACHABLE);
        assertThat(elapsed).isBetween(900L, 1800L);
    }

    @Test
    void 풀이_가득_차면_2초_대기_후_예외() throws Exception {
        delayApprove(4000);
        PgClient single = client(PgContainers.baseUrl(), 1);
        // 하나뿐인 커넥션을 3초(응답 타임아웃) 동안 붙잡아 둔다
        CompletableFuture<Void> holder = CompletableFuture.runAsync(() -> {
            try {
                single.approve(orderId(), 1000, "key-hold-1");
            } catch (PgException ignored) {
                // 응답 타임아웃이 정상 결과다
            }
        });
        Thread.sleep(300);
        long start = System.nanoTime();

        PgException e = catchThrowableOfType(PgException.class,
                () -> single.approve(orderId(), 1000, "key-wait-1"));

        long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        assertThat(e.kind()).isEqualTo(PgException.Kind.POOL_TIMEOUT);
        assertThat(elapsed).isBetween(1900L, 2700L);
        holder.get(5, TimeUnit.SECONDS);
    }
}
