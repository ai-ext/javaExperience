package com.example.board.coupon;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CouponIssueConcurrencyTest extends ApiTestSupport {

    @Autowired
    CouponRepository couponRepository;

    Long newCoupon(int total) {
        return couponRepository.saveAndFlush(Coupon.create("선착순", total, LocalDateTime.now().plusDays(30))).getId();
    }

    MvcResult issue(Long couponId, Member m) throws Exception {
        return mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(m)))
                .andReturn();
    }

    int issued(Long couponId) {
        return jdbc.queryForObject("SELECT issued_quantity FROM coupon WHERE id = ?", Integer.class, couponId);
    }

    int owned(Long couponId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM member_coupon WHERE coupon_id = ?", Integer.class, couponId);
    }

    String stock(Long couponId) {
        return redis.opsForValue().get("coupon:" + couponId + ":stock");
    }

    List<Member> members(int n) {
        List<Member> list = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            list.add(newMember(Role.USER));
        }
        return list;
    }

    @Test
    void 수량_10장에_100명이_동시에_요청하면_정확히_10명만_201이다() throws Exception {
        Long couponId = newCoupon(10);

        List<MvcResult> results = runConcurrently(members(100).stream()
                .map(m -> (Callable<MvcResult>) () -> issue(couponId, m)).toList());

        assertThat(results.stream().filter(r -> r.getResponse().getStatus() == 201)).hasSize(10);
        List<MvcResult> rejected = results.stream().filter(r -> r.getResponse().getStatus() != 201).toList();
        assertThat(rejected).hasSize(90).allSatisfy(r -> {
            assertThat(r.getResponse().getStatus()).isEqualTo(409);
            assertThat(r.getResponse().getContentAsString()).contains("/errors/coupon-exhausted");
        });
        assertThat(issued(couponId)).isEqualTo(10);
        assertThat(owned(couponId)).isEqualTo(10);
        // 소진 뒤 요청은 Redis에서 걸러졌다
        assertThat(stock(couponId)).isEqualTo("0");
    }

    @Test
    void 열한_번째_발급은_409_coupon_exhausted() throws Exception {
        Long couponId = newCoupon(10);
        for (Member m : members(10)) {
            assertThat(issue(couponId, m).getResponse().getStatus()).isEqualTo(201);
        }

        mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.type").value("/errors/coupon-exhausted"));
        assertThat(issued(couponId)).isEqualTo(10);
    }

    @Test
    void 잔여_수량_키는_첫_발급_때_DB_값으로_채운다() throws Exception {
        Long couponId = newCoupon(10);
        jdbc.update("UPDATE coupon SET issued_quantity = 3 WHERE id = ?", couponId);

        issue(couponId, newMember(Role.USER));

        // DB 남은 수량 7에서 한 장 = 6
        assertThat(stock(couponId)).isEqualTo("6");
    }

    // 함정: Redis 수량과 DB가 어긋나도 DB가 기준이다. Redis는 거름망일 뿐이다.
    @Test
    void Redis_수량이_DB보다_많아도_DB_총량까지만_발급된다() throws Exception {
        Long couponId = newCoupon(10);
        redis.opsForValue().set("coupon:" + couponId + ":stock", "100");

        List<MvcResult> results = runConcurrently(members(100).stream()
                .map(m -> (Callable<MvcResult>) () -> issue(couponId, m)).toList());

        assertThat(results.stream().filter(r -> r.getResponse().getStatus() == 201)).hasSize(10);
        assertThat(issued(couponId)).isEqualTo(10);
        assertThat(owned(couponId)).isEqualTo(10);
        // DB가 소진이라고 답하면 Redis를 0으로 맞춘다
        assertThat(stock(couponId)).isEqualTo("0");
    }

    // 함정: DECR 뒤 DB에서 실패(중복 등)했는데 되돌리지 않으면 Redis 수량이 새서 실제보다 적게 나간다
    @Test
    void DB에서_실패한_요청의_수량은_Redis로_되돌린다() throws Exception {
        Long couponId = newCoupon(5);
        Member clicker = newMember(Role.USER);
        runConcurrently(Collections.nCopies(20, clicker).stream()
                .map(m -> (Callable<MvcResult>) () -> issue(couponId, m)).toList());
        assertThat(owned(couponId)).isEqualTo(1);
        assertThat(stock(couponId)).isEqualTo("4");

        List<Integer> others = new ArrayList<>();
        for (Member m : members(5)) {
            others.add(issue(couponId, m).getResponse().getStatus());
        }

        assertThat(others).containsExactly(201, 201, 201, 201, 409);
        assertThat(issued(couponId)).isEqualTo(5);
    }

    private static <T> List<T> runConcurrently(List<Callable<T>> tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<T>> futures = new ArrayList<>();
            for (Callable<T> t : tasks) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return t.call();
                }));
            }
            start.countDown();
            List<T> result = new ArrayList<>();
            for (Future<T> f : futures) {
                result.add(f.get(30, TimeUnit.SECONDS));
            }
            return result;
        } finally {
            pool.shutdownNow();
        }
    }
}
