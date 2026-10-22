package com.example.board.tickets;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.sql.Statement;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.BooleanSupplier;

import javax.sql.DataSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.example.board.ApiTestSupport;
import com.example.board.PgContainers;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B06 확인 테스트: 구매 알림(웹훅)이 느린 동안 shop_item에 컬럼을 추가해도 상점 주문이 멈추지 않는다.
 * 알림 서버는 PG 모의(WireMock)의 /hooks/orders로 두고 4초 늦게 답하게 한다.
 * 판정: 첫 주문이 알림을 기다리는 동안 ALTER를 걸고, 그 뒤에 온 다른 회원의 주문이 1.5초 안에 반영(포인트 차감)되는가.
 */
class B06ConfirmTest extends ApiTestSupport {

    private static final String COLUMN = "b06_memo";
    private static final HttpClient HTTP = HttpClient.newHttpClient();

    @DynamicPropertySource
    static void webhook(DynamicPropertyRegistry registry) {
        registry.add("board.shop.order-webhook-url", () -> wiremockUrl() + "/hooks/orders");
    }

    @Autowired
    DataSource dataSource;

    private final ExecutorService pool = Executors.newFixedThreadPool(3);

    @AfterEach
    void cleanUp() throws Exception {
        pool.shutdown();
        pool.awaitTermination(20, TimeUnit.SECONDS);
        try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
            st.execute("SET SESSION lock_wait_timeout = 10");
            Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.columns"
                    + " WHERE table_schema = DATABASE() AND table_name = 'shop_item' AND column_name = ?", Integer.class, COLUMN);
            if (exists != null && exists > 0) {
                st.execute("ALTER TABLE shop_item DROP COLUMN " + COLUMN);
            }
        }
        PgContainers.reset();
    }

    @Test
    void 구매_알림이_느린_동안_컬럼을_추가해도_다른_주문은_멈추지_않는다() throws Exception {
        PgContainers.stub("""
                {"priority":1,"request":{"method":"POST","urlPath":"/hooks/orders"},
                 "response":{"status":200,"fixedDelayMilliseconds":4000}}
                """);
        long itemId = item(100, 100);
        Member first = memberWithPoints(1000);
        Member second = memberWithPoints(1000);

        Future<Integer> firstOrder = pool.submit(() -> order(first, itemId));
        // 첫 주문이 알림 서버 응답을 기다리기 시작할 때까지
        assertThat(waitUntil(5000, () -> webhookCalls() >= 1)).as("첫 주문의 구매 알림 호출").isTrue();

        Future<?> alter = pool.submit(() -> {
            try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
                st.execute("SET SESSION lock_wait_timeout = 10");
                st.execute("ALTER TABLE shop_item ADD COLUMN " + COLUMN + " VARCHAR(20) NULL");
            }
            return null;
        });
        // ALTER가 끝났거나 메타데이터 락을 기다리기 시작할 때까지
        waitUntil(1000, () -> alter.isDone() || alterWaitingForMetadataLock());

        long start = System.nanoTime();
        pool.submit(() -> order(second, itemId));
        boolean applied = waitUntil(1500, () -> balance(second) == 900);
        long elapsedMillis = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);

        assertThat(applied).as("ALTER 대기 중 다른 회원 주문이 1.5초 안에 반영됐다(걸린 시간 %dms)", elapsedMillis).isTrue();
        assertThat(firstOrder.get(15, TimeUnit.SECONDS)).as("첫 주문 응답 코드").isEqualTo(201);
        alter.get(15, TimeUnit.SECONDS);
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

    private boolean alterWaitingForMetadataLock() {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.processlist"
                + " WHERE state = 'Waiting for table metadata lock' AND info LIKE 'ALTER TABLE shop_item%'", Integer.class);
        return n != null && n > 0;
    }

    /** WireMock 관리 API는 Toxiproxy를 거쳐서도 닿는다. 받은 /hooks/orders 요청 수. */
    private int webhookCalls() {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(wiremockUrl() + "/__admin/requests/count"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{\"method\":\"POST\",\"urlPath\":\"/hooks/orders\"}"))
                    .build();
            String body = HTTP.send(request, HttpResponse.BodyHandlers.ofString()).body();
            return Integer.parseInt(body.replaceAll("\\D+", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    /** PG 모의 주소. localhost가 IPv6(::1)로 먼저 풀려 다른 프로세스에 닿지 않게 IPv4로 고정한다. */
    private static String wiremockUrl() {
        return PgContainers.baseUrl().replace("://localhost:", "://127.0.0.1:");
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
