package com.example.board.tickets;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B03 확인 테스트: 구매는 "전부 반영되거나 전부 되돌려진다". 테스트에는 바깥 트랜잭션이 없고,
 * 주문·재고·쿠폰·잔액의 최종 상태로만 판정한다. 구매 감사 쿠폰(선착순)은 이 테스트가 만든 id로 켠다.
 */
@TestPropertySource(properties = "board.shop.thanks-coupon-id=" + B03ConfirmTest.THANKS_COUPON_ID)
class B03ConfirmTest extends ApiTestSupport {

    static final long THANKS_COUPON_ID = 990301;

    @BeforeEach
    void thanksCoupon() {
        jdbc.update("INSERT IGNORE INTO coupon (id, name, total_quantity, issued_quantity, expires_at, created_at, updated_at)"
                + " VALUES (?, '구매 감사 쿠폰', 1, 0, NOW(6) + INTERVAL 30 DAY, NOW(6), NOW(6))", THANKS_COUPON_ID);
    }

    @Test
    void 포인트가_모자라_실패한_주문은_재고와_쿠폰을_건드리지_않는다() throws Exception {
        Member m = memberWithPoints(50);
        long itemId = item(100, 10);
        long memberCouponId = ownCoupon(m);

        int status = order(m, UUID.randomUUID().toString(), itemId, memberCouponId);

        assertThat(status).as("응답 코드").isEqualTo(409);
        assertThat(stock(itemId)).as("재고").isEqualTo(10);
        assertThat(couponStatus(memberCouponId)).as("쿠폰 상태").isEqualTo("UNUSED");
        assertThat(orders(m)).as("주문 수").isZero();
        assertThat(balance(m)).as("잔액").isEqualTo(50);
    }

    @Test
    void 감사_쿠폰이_떨어져도_구매는_201로_한_번_반영된다() throws Exception {
        // 감사 쿠폰을 이미 다 나눠 준 상태
        jdbc.update("UPDATE coupon SET issued_quantity = total_quantity WHERE id = ?", THANKS_COUPON_ID);
        Member m = memberWithPoints(1000);
        long itemId = item(100, 10);

        int status = order(m, UUID.randomUUID().toString(), itemId, null);

        assertThat(status).as("응답 코드").isEqualTo(201);
        assertThat(orders(m)).as("주문 수").isEqualTo(1);
        assertThat(stock(itemId)).as("재고").isEqualTo(9);
        assertThat(balance(m)).as("잔액").isEqualTo(900);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM member_coupon WHERE member_id = ? AND coupon_id = ?",
                Integer.class, m.getId(), THANKS_COUPON_ID)).as("받은 감사 쿠폰").isZero();
    }

    @Test
    void 같은_키로_동시에_두_번_눌러도_재고와_잔액은_한_번만_줄어든다() throws Exception {
        jdbc.update("UPDATE coupon SET issued_quantity = total_quantity WHERE id = ?", THANKS_COUPON_ID);
        Member m = memberWithPoints(1000);
        long itemId = item(100, 10);
        String key = UUID.randomUUID().toString();

        List<Integer> statuses = concurrently(2, () -> order(m, key, itemId, null));

        assertThat(statuses).as("응답 코드").containsOnly(201);
        assertThat(orders(m)).as("주문 수").isEqualTo(1);
        assertThat(stock(itemId)).as("재고").isEqualTo(9);
        assertThat(balance(m)).as("잔액").isEqualTo(900);
    }

    private Member memberWithPoints(long points) {
        Member m = newMember(Role.USER);
        jdbc.update("UPDATE member SET point_balance = ? WHERE id = ?", points, m.getId());
        return m;
    }

    private long item(long price, int stock) {
        jdbc.update("INSERT INTO shop_item (name, price, stock, created_at, updated_at) VALUES ('B03 아이템', ?, ?, NOW(6), NOW(6))",
                price, stock);
        return jdbc.queryForObject("SELECT MAX(id) FROM shop_item", Long.class);
    }

    private long ownCoupon(Member m) {
        jdbc.update("INSERT INTO coupon (name, total_quantity, issued_quantity, expires_at, created_at, updated_at)"
                + " VALUES ('B03 할인 쿠폰', 5, 1, NOW(6) + INTERVAL 1 DAY, NOW(6), NOW(6))");
        long couponId = jdbc.queryForObject("SELECT MAX(id) FROM coupon WHERE name = 'B03 할인 쿠폰'", Long.class);
        jdbc.update("INSERT INTO member_coupon (coupon_id, member_id, status, created_at, updated_at)"
                + " VALUES (?, ?, 'UNUSED', NOW(6), NOW(6))", couponId, m.getId());
        return jdbc.queryForObject("SELECT id FROM member_coupon WHERE coupon_id = ? AND member_id = ?", Long.class,
                couponId, m.getId());
    }

    private int order(Member m, String key, long itemId, Long memberCouponId) throws Exception {
        String body = "{\"itemId\":" + itemId + ",\"quantity\":1"
                + (memberCouponId == null ? "" : ",\"memberCouponId\":" + memberCouponId) + "}";
        return mockMvc.perform(post("/api/shop/orders").contentType(MediaType.APPLICATION_JSON).content(body)
                .header("Authorization", bearer(m)).header("Idempotency-Key", key)).andReturn().getResponse().getStatus();
    }

    private List<Integer> concurrently(int n, Callable<Integer> call) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(n);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return call.call();
                }));
            }
            start.countDown();
            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> f : futures) {
                statuses.add(f.get(20, TimeUnit.SECONDS));
            }
            return statuses;
        } finally {
            pool.shutdownNow();
        }
    }

    private int stock(long itemId) {
        return jdbc.queryForObject("SELECT stock FROM shop_item WHERE id = ?", Integer.class, itemId);
    }

    private String couponStatus(long memberCouponId) {
        return jdbc.queryForObject("SELECT status FROM member_coupon WHERE id = ?", String.class, memberCouponId);
    }

    private int orders(Member m) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM shop_order WHERE member_id = ?", Integer.class, m.getId());
    }

    private long balance(Member m) {
        return jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId());
    }
}
