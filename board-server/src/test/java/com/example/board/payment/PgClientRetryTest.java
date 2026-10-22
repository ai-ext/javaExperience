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

class PgClientRetryTest {

    @BeforeAll
    static void up() {
        PgContainers.start();
    }

    @AfterEach
    void reset() {
        PgContainers.reset();
    }

    PgClient client() {
        BoardProperties.Pg pg = new BoardProperties.Pg(PgContainers.baseUrl(), Duration.ofSeconds(1),
                Duration.ofSeconds(3), Duration.ofSeconds(2), 10);
        return new PgClient(PgClientConfig.pgRestClient(pg), new PgRetryPolicy());
    }

    String orderId() {
        return "CHG-" + UUID.randomUUID();
    }

    void stubStatusSequence(int first, int second) {
        PgContainers.stub(scenario("Started", "second", first));
        PgContainers.stub(scenario("second", "third", second));
        PgContainers.stub("""
                {"priority":1,"scenarioName":"retry","requiredScenarioState":"third",
                 "request":{"method":"POST","urlPath":"/pg/v1/payments"},
                 "response":{"status":200,"headers":{"Content-Type":"application/json"},
                  "jsonBody":{"paymentKey":"pk-retry","status":"DONE","amount":1000}}}
                """);
    }

    String scenario(String state, String next, int status) {
        return """
                {"priority":1,"scenarioName":"retry","requiredScenarioState":"%s","newScenarioState":"%s",
                 "request":{"method":"POST","urlPath":"/pg/v1/payments"},"response":{"status":%d}}
                """.formatted(state, next, status);
    }

    long millisSince(long start) {
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
    }

    @Test
    void _503_두_번_뒤_200이면_성공하고_PG는_같은_키로_3번_받는다() {
        stubStatusSequence(503, 503);
        long start = System.nanoTime();

        PgApproval approval = client().approve(orderId(), 1000, "key-retry-503");

        assertThat(approval.status()).isEqualTo(PgApproval.Status.DONE);
        assertThat(PgContainers.approveIdempotencyKeys()).containsExactly("key-retry-503", "key-retry-503",
                "key-retry-503");
        // 백오프 200ms + 400ms (+ 지터 0~100ms씩)
        assertThat(millisSince(start)).isGreaterThanOrEqualTo(600L);
    }

    @Test
    void _5xx가_계속되면_3번_보내고_포기한다() {
        stubStatusSequence(500, 500);
        PgContainers.stub("""
                {"priority":0,"scenarioName":"retry","requiredScenarioState":"third",
                 "request":{"method":"POST","urlPath":"/pg/v1/payments"},"response":{"status":500}}
                """);

        PgException e = catchThrowableOfType(PgException.class, () -> client().approve(orderId(), 1000, "key-5xx-1"));

        assertThat(e.kind()).isEqualTo(PgException.Kind.SERVER_ERROR);
        assertThat(PgContainers.approveRequestCount()).isEqualTo(3);
    }

    @Test
    void 거절_400은_재시도하지_않는다() {
        // 파일 스텁: 금액 999000은 항상 거절(400)
        PgException e = catchThrowableOfType(PgException.class,
                () -> client().approve(orderId(), 999000, "key-declined-1"));

        assertThat(e.kind()).isEqualTo(PgException.Kind.DECLINED);
        assertThat(PgContainers.approveRequestCount()).isEqualTo(1);
    }

    @Test
    void 응답_타임아웃은_재시도하지_않는다() {
        PgContainers.stubApproveDelay(4000);
        long start = System.nanoTime();

        PgException e = catchThrowableOfType(PgException.class,
                () -> client().approve(orderId(), 1000, "key-timeout-2"));

        assertThat(e.kind()).isEqualTo(PgException.Kind.TIMEOUT);
        assertThat(millisSince(start)).isLessThan(3800L);
        assertThat(PgContainers.approveRequestCount()).isEqualTo(1);
    }

    @Test
    void 연결_실패는_재시도하고_복구되면_성공한다() throws Exception {
        PgContainers.proxy().disable();
        long start = System.nanoTime();
        CompletableFuture<PgApproval> call = CompletableFuture.supplyAsync(
                () -> client().approve(orderId(), 1000, "key-reconnect-1"));
        Thread.sleep(100);
        PgContainers.proxy().enable();

        PgApproval approval = call.get(5, TimeUnit.SECONDS);

        assertThat(approval.status()).isEqualTo(PgApproval.Status.DONE);
        // 첫 시도는 PG에 닿지 않았으므로 PG가 받은 요청은 1번이다
        assertThat(PgContainers.approveIdempotencyKeys()).containsExactly("key-reconnect-1");
        assertThat(millisSince(start)).isGreaterThanOrEqualTo(200L);
    }

    @Test
    void 연결_실패가_계속되면_백오프_후_3번째에_포기한다() throws Exception {
        PgContainers.proxy().disable();
        long start = System.nanoTime();

        PgException e = catchThrowableOfType(PgException.class,
                () -> client().approve(orderId(), 1000, "key-unreachable-1"));

        assertThat(e.kind()).isEqualTo(PgException.Kind.UNREACHABLE);
        assertThat(millisSince(start)).isBetween(600L, 1500L);
    }
}
