package com.example.board.tickets;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.sql.Connection;
import java.sql.Statement;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.BooleanSupplier;

import javax.sql.DataSource;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.sun.net.httpserver.HttpServer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B06 확인 테스트: 구매 알림(웹훅)이 느린 동안 shop_item에 컬럼을 추가해도 상점 주문이 멈추지 않는다.
 *
 * <p>알림 서버는 테스트 안의 작은 HTTP 서버다. 받은 알림 요청은 테스트가 해제 신호를 줄 때까지 응답하지 않는다
 * (알림 쪽 읽기 타임아웃 10초 안에서). 그래서 "첫 주문이 알림을 기다리는 구간"이 테스트가 끝낼 때까지 고정된다.
 * 순서: 첫 주문이 알림을 기다린다 → 별도 연결로 ALTER(끝났거나 메타데이터 락 대기 중임을 확인) → 다른 회원의 주문 →
 * 첫 알림을 붙잡아 둔 채로 그 주문이 반영(포인트 차감)되는가. 판정 뒤에 알림을 놓아주고 모든 응답을 회수한다.
 */
class B06ConfirmTest extends ApiTestSupport {

    private static final String COLUMN = "b06_memo";
    /** 알림 쪽 읽기 타임아웃(10초)보다 짧게. 이 안에 판정이 끝나야 "첫 알림을 기다리는 중"이 유지된다. */
    private static final long HOLD_LIMIT_MILLIS = 9000;

    private static final AtomicInteger webhookCalls = new AtomicInteger();
    private static final AtomicLong firstWebhookAt = new AtomicLong();
    private static volatile CountDownLatch release = new CountDownLatch(1);
    private static final HttpServer webhook = startWebhook();

    @DynamicPropertySource
    static void webhook(DynamicPropertyRegistry registry) {
        registry.add("board.shop.order-webhook-url",
                () -> "http://127.0.0.1:" + webhook.getAddress().getPort() + "/hooks/orders");
    }

    @Autowired
    DataSource dataSource;

    private final ExecutorService pool = Executors.newFixedThreadPool(3);

    @AfterEach
    void cleanUp() throws Exception {
        release.countDown();
        pool.shutdown();
        pool.awaitTermination(30, TimeUnit.SECONDS);
        try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
            st.execute("SET SESSION lock_wait_timeout = 10");
            Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.columns"
                    + " WHERE table_schema = DATABASE() AND table_name = 'shop_item' AND column_name = ?", Integer.class, COLUMN);
            if (exists != null && exists > 0) {
                st.execute("ALTER TABLE shop_item DROP COLUMN " + COLUMN);
            }
        }
    }

    @AfterAll
    static void stopWebhook() {
        release.countDown();
        webhook.stop(0);
    }

    @Test
    void 구매_알림이_느린_동안_컬럼을_추가해도_다른_주문은_멈추지_않는다() throws Exception {
        webhookCalls.set(0);
        release = new CountDownLatch(1);
        long itemId = item(100, 100);
        Member first = memberWithPoints(1000);
        Member second = memberWithPoints(1000);

        Future<Integer> firstOrder = pool.submit(() -> order(first, itemId));
        require(waitUntil(5000, () -> webhookCalls.get() >= 1), "첫 주문의 구매 알림이 알림 서버에 닿지 않았다");

        Future<?> alter = pool.submit(() -> {
            try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
                st.execute("SET SESSION lock_wait_timeout = 10");
                st.execute("ALTER TABLE shop_item ADD COLUMN " + COLUMN + " VARCHAR(20) NULL");
            }
            return null;
        });
        // ALTER가 이미 끝났거나(락을 쥔 트랜잭션이 없음) 메타데이터 락을 기다리는 중이어야 "ALTER 뒤의 주문"을 볼 수 있다
        require(waitUntil(3000, () -> alter.isDone() || alterWaitingForMetadataLock()),
                "ALTER가 끝나지도, 메타데이터 락 대기에 들어가지도 않았다");

        long start = System.nanoTime();
        Future<Integer> secondOrder = pool.submit(() -> order(second, itemId));
        boolean applied = waitUntil(4000, () -> balance(second) == 900);
        long elapsedMillis = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        long heldMillis = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - firstWebhookAt.get());
        boolean alterWaiting = !alter.isDone() && alterWaitingForMetadataLock();

        require(heldMillis < HOLD_LIMIT_MILLIS,
                "판정 시점에 첫 알림이 아직 응답을 기다리는 중이어야 한다(붙잡은 시간 %dms)".formatted(heldMillis));
        assertThat(applied)
                .as("첫 주문의 알림이 끝나지 않은 동안 ALTER 뒤에 온 다른 회원의 주문이 4초 안에 반영됐다"
                        + "(기다린 시간 %dms, 판정 시점 ALTER 메타데이터 락 대기 중=%s)", elapsedMillis, alterWaiting)
                .isTrue();

        release.countDown();
        assertThat(secondOrder.get(20, TimeUnit.SECONDS)).as("다른 회원 주문 응답 코드").isEqualTo(201);
        assertThat(firstOrder.get(20, TimeUnit.SECONDS)).as("첫 주문 응답 코드").isEqualTo(201);
        alter.get(20, TimeUnit.SECONDS);
    }

    /** 준비 조건. 단언 실패(결함 증상)와 구분되도록 단언이 아닌 예외로 끝낸다. */
    private static void require(boolean ok, String message) {
        if (!ok) {
            throw new IllegalStateException("준비 실패: " + message);
        }
    }

    /** 알림 서버: 요청을 세고, 해제 신호가 올 때까지(최대 HOLD_LIMIT) 응답하지 않는다. */
    private static HttpServer startWebhook() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
            server.createContext("/hooks/orders", exchange -> {
                try (exchange) {
                    exchange.getRequestBody().readAllBytes();
                    if (webhookCalls.incrementAndGet() == 1) {
                        firstWebhookAt.set(System.nanoTime());
                    }
                    release.await(HOLD_LIMIT_MILLIS, TimeUnit.MILLISECONDS);
                    exchange.sendResponseHeaders(200, -1);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            server.setExecutor(Executors.newCachedThreadPool(r -> {
                Thread t = new Thread(r, "b06-webhook");
                t.setDaemon(true);
                return t;
            }));
            server.start();
            return server;
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    private int order(Member m, long itemId) throws Exception {
        return mockMvc.perform(post("/api/shop/orders").contentType(MediaType.APPLICATION_JSON)
                .content("{\"itemId\":" + itemId + ",\"quantity\":1}")
                .header("Authorization", bearer(m)).header("Idempotency-Key", UUID.randomUUID().toString()))
                .andReturn().getResponse().getStatus();
    }

    private Member memberWithPoints(long points) {
        Member m = newMember(Role.USER);
        jdbc.update("UPDATE member SET point_balance = ? WHERE id = ?", points, m.getId());
        return m;
    }

    private long item(long price, int stock) {
        jdbc.update("INSERT INTO shop_item (name, price, stock, created_at, updated_at) VALUES ('B06 아이템', ?, ?, NOW(6), NOW(6))",
                price, stock);
        return jdbc.queryForObject("SELECT MAX(id) FROM shop_item", Long.class);
    }

    /** member 테이블은 ALTER 대상(shop_item)과 FK로 엮이지 않아 메타데이터 락 대기에 걸리지 않는다. */
    private long balance(Member m) {
        return jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId());
    }

    /**
     * ALTER는 테스트와 같은 DB 계정으로 연결했다. PROCESS 권한이 없는 계정도 자기 계정의 세션은
     * information_schema.processlist에서 볼 수 있다(남의 계정 세션·innodb_trx·metadata_locks는 root가 필요하다).
     */
    private boolean alterWaitingForMetadataLock() {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.processlist"
                + " WHERE state = 'Waiting for table metadata lock' AND info LIKE 'ALTER TABLE shop_item%'", Integer.class);
        return n != null && n > 0;
    }

    private static boolean waitUntil(long millis, BooleanSupplier condition) throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(millis);
        while (System.nanoTime() < deadline) {
            if (condition.getAsBoolean()) {
                return true;
            }
            Thread.sleep(20);
        }
        return condition.getAsBoolean();
    }
}
