package com.example.board.coupon;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CouponIssueApiTest extends ApiTestSupport {

    @Autowired
    CouponRepository couponRepository;

    Long newCoupon(int total) {
        return couponRepository.saveAndFlush(Coupon.create("신규 쿠폰", total, LocalDateTime.now().plusDays(30))).getId();
    }

    int issue(Long couponId, Member m) throws Exception {
        return mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(m)))
                .andReturn().getResponse().getStatus();
    }

    int issued(Long couponId) {
        return jdbc.queryForObject("SELECT issued_quantity FROM coupon WHERE id = ?", Integer.class, couponId);
    }

    int owned(Long couponId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM member_coupon WHERE coupon_id = ?", Integer.class, couponId);
    }

    @Test
    void 발급하면_201과_memberCouponId() throws Exception {
        Long couponId = newCoupon(5);
        Member m = newMember(Role.USER);

        mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(m)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.memberCouponId").isNumber());

        assertThat(issued(couponId)).isEqualTo(1);
        assertThat(owned(couponId)).isEqualTo(1);
    }

    @Test
    void 같은_회원이_다시_받으면_409_duplicate이고_수량은_한_장만_줄어든다() throws Exception {
        Long couponId = newCoupon(5);
        Member m = newMember(Role.USER);
        issue(couponId, m);

        mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(m)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.type").value("/errors/duplicate"));

        assertThat(issued(couponId)).isEqualTo(1);
    }

    @Test
    void 소진된_뒤에는_409_coupon_exhausted() throws Exception {
        Long couponId = newCoupon(1);
        issue(couponId, newMember(Role.USER));

        mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.type").value("/errors/coupon-exhausted"));
    }

    @Test
    void 없는_쿠폰은_404() throws Exception {
        mockMvc.perform(post("/api/coupons/{id}/issue", 999_999_999L).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isNotFound());
    }

    @Test
    void 내_쿠폰_목록은_200이고_내_것만_나온다() throws Exception {
        Long couponId = newCoupon(5);
        Member m = newMember(Role.USER);
        issue(couponId, m);
        issue(couponId, newMember(Role.USER));

        mockMvc.perform(get("/api/me/coupons").header("Authorization", bearer(m)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].couponId").value(couponId))
                .andExpect(jsonPath("$[0].name").value("신규 쿠폰"))
                .andExpect(jsonPath("$[0].status").value("UNUSED"))
                .andExpect(jsonPath("$[0].expiresAt").isString());
        mockMvc.perform(get("/api/me/coupons").header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void 토큰_없으면_401() throws Exception {
        mockMvc.perform(post("/api/coupons/1/issue")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/me/coupons")).andExpect(status().isUnauthorized());
    }

    // 함정: 발급 버튼 연타로 같은 회원의 요청이 동시에 오면 "이미 받았나" 조회가 모두 통과한다
    @Test
    void 같은_회원이_동시에_10번_눌러도_두_장_받지_않는다() throws Exception {
        Long couponId = newCoupon(5);
        Member m = newMember(Role.USER);

        List<Integer> statuses = runConcurrently(java.util.Collections.nCopies(10, m).stream()
                .map(x -> (java.util.concurrent.Callable<Integer>) () -> issue(couponId, x)).toList());

        assertThat(statuses.stream().filter(s -> s == 201).count()).isLessThanOrEqualTo(1);
        assertThat(owned(couponId)).isLessThanOrEqualTo(1);
    }

    // 함정: 읽어서 남았는지 확인한 뒤 올리면 총 수량을 넘는다
    @Test
    void 서로_다른_회원_20명이_수량_10장을_동시에_받아도_10장을_넘지_않는다() throws Exception {
        Long couponId = newCoupon(10);
        List<java.util.concurrent.Callable<Integer>> tasks = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            Member m = newMember(Role.USER);
            tasks.add(() -> issue(couponId, m));
        }

        List<Integer> statuses = runConcurrently(tasks);

        assertThat(statuses.stream().filter(s -> s == 201).count()).isLessThanOrEqualTo(10);
        assertThat(issued(couponId)).isLessThanOrEqualTo(10).isEqualTo(owned(couponId));
    }

    private List<Integer> runConcurrently(List<java.util.concurrent.Callable<Integer>> tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (var t : tasks) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return t.call();
                }));
            }
            start.countDown();
            List<Integer> result = new ArrayList<>();
            for (Future<Integer> f : futures) {
                result.add(f.get());
            }
            return result;
        } finally {
            pool.shutdownNow();
        }
    }
}
