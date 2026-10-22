package com.example.board.tickets;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B07 확인 테스트: 선착순 쿠폰을 여러 회원이 동시에 받아도 결과는 201(발급) 또는 정해진 409(소진)뿐이다.
 * 500이 하나라도 있거나, 발급 수량(issued_quantity)과 실제 발급 행 수가 어긋나면 실패다.
 */
class B07ConfirmTest extends ApiTestSupport {

    private static final int MEMBERS = 20;

    @Test
    void 수량_20장을_20명이_동시에_받으면_모두_201이다() throws Exception {
        for (int round = 1; round <= 3; round++) {
            long couponId = newCoupon(MEMBERS);

            List<Integer> statuses = issueConcurrently(couponId, members(MEMBERS));

            assertThat(statuses).as("%d회차 응답 코드", round).containsOnly(201);
            assertThat(issued(couponId)).as("%d회차 issued_quantity", round).isEqualTo(MEMBERS);
            assertThat(owned(couponId)).as("%d회차 발급 행 수", round).isEqualTo(MEMBERS);
        }
    }

    @Test
    void 수량_10장을_20명이_동시에_받으면_10명은_201_나머지는_409다() throws Exception {
        for (int round = 1; round <= 3; round++) {
            long couponId = newCoupon(10);

            List<Integer> statuses = issueConcurrently(couponId, members(MEMBERS));

            assertThat(statuses).as("%d회차 응답 코드", round).containsOnly(201, 409);
            assertThat(statuses.stream().filter(s -> s == 201)).as("%d회차 201 수", round).hasSize(10);
            assertThat(issued(couponId)).as("%d회차 issued_quantity", round).isEqualTo(10);
            assertThat(owned(couponId)).as("%d회차 발급 행 수", round).isEqualTo(10);
        }
    }

    private long newCoupon(int total) {
        jdbc.update("INSERT INTO coupon (name, total_quantity, issued_quantity, expires_at, created_at, updated_at)"
                + " VALUES ('B07 선착순', ?, 0, NOW(6) + INTERVAL 30 DAY, NOW(6), NOW(6))", total);
        return jdbc.queryForObject("SELECT MAX(id) FROM coupon", Long.class);
    }

    private List<Member> members(int n) {
        List<Member> list = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            list.add(newMember(Role.USER));
        }
        return list;
    }

    private List<Integer> issueConcurrently(long couponId, List<Member> members) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(members.size());
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (Member m : members) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(m)))
                            .andReturn().getResponse().getStatus();
                }));
            }
            start.countDown();
            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> f : futures) {
                statuses.add(f.get(60, TimeUnit.SECONDS));
            }
            return statuses;
        } finally {
            pool.shutdownNow();
        }
    }

    private int issued(long couponId) {
        return jdbc.queryForObject("SELECT issued_quantity FROM coupon WHERE id = ?", Integer.class, couponId);
    }

    private int owned(long couponId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM member_coupon WHERE coupon_id = ?", Integer.class, couponId);
    }
}
