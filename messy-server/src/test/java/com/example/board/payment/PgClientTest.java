package com.example.board.payment;

import java.io.Closeable;
import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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
                Duration.ofSeconds(2), maxConnections, "test-only-pg-secret-test-only-pg-secret");
        // 타임아웃 자체만 보려고 재시도는 끈다(재시도는 PgClientRetryTest)
        return new PgClient(PgClientConfig.pgRestClient(pg), new PgRetryPolicy(1));
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
    void PG가_끊은_keep_alive_커넥션은_버리고_새로_연결한다() {
        PgClient pgClient = client(PgContainers.baseUrl(), 10);
        pgClient.approve(orderId(), 1000, "key-keepalive-1");
        // 프록시를 다시 만들면 풀에 남은 커넥션이 서버 쪽에서 끊긴다
        PgContainers.healProxy();

        PgApproval approval = pgClient.approve(orderId(), 1000, "key-keepalive-2");

        assertThat(approval.status()).isEqualTo(PgApproval.Status.DONE);
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
    void SYN에_답이_없는_주소는_1초에_연결_타임아웃() throws IOException {
        List<Closeable> resources = new ArrayList<>();
        try {
            String baseUrl = unansweredBaseUrl(resources);
            long start = System.nanoTime();

            PgException e = catchThrowableOfType(PgException.class,
                    () -> client(baseUrl, 10).approve(orderId(), 1000, "key-blackhole-1"));

            long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
            assertThat(e.kind()).isEqualTo(PgException.Kind.UNREACHABLE);
            assertThat(elapsed).isBetween(900L, 1800L);
        } finally {
            for (Closeable resource : resources) {
                resource.close();
            }
        }
    }

    /**
     * SYN에 답이 없는 로컬 주소. "응답 없는 외부 주소"는 망마다 다르게 군다(사내망은 바로 거절하거나 프록시가 받는다).
     * Linux: backlog 1로 열고 accept하지 않는 리스너의 대기열을 채우면 그 뒤 SYN은 버려진다.
     * macOS: 대기열이 넘치면 RST를 보내므로, lo0에 붙지 않은 루프백 주소(127.0.0.2)를 쓴다. 그 주소로 간 SYN은 버려진다.
     * 어느 쪽이든 200ms 안에 연결이 붙지 않는 것을 확인한 주소만 돌려준다.
     */
    static String unansweredBaseUrl(List<Closeable> resources) throws IOException {
        ServerSocket listener = new ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"));
        resources.add(listener);
        for (int i = 0; i < 64; i++) {
            Socket filler = new Socket();
            resources.add(filler);
            try {
                filler.connect(listener.getLocalSocketAddress(), 200);
            } catch (SocketTimeoutException queueFull) {
                return "http://127.0.0.1:" + listener.getLocalPort();
            } catch (SocketException reset) {
                break;
            }
        }
        try (Socket probe = new Socket()) {
            probe.connect(new InetSocketAddress("127.0.0.2", listener.getLocalPort()), 200);
        } catch (SocketTimeoutException dropped) {
            return "http://127.0.0.2:" + listener.getLocalPort();
        } catch (IOException refused) {
            // 127.0.0.2가 로컬 주소인 OS(Linux)는 바로 거절한다. 아래에서 실패로 알린다
        }
        throw new IllegalStateException("SYN에 답이 없는 로컬 주소를 만들지 못했다");
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
