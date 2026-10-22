package com.example.board.tickets;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.mysql.MySQLContainer;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B07 확인 테스트: 선착순 쿠폰을 여러 회원이 동시에 받아도 결과는 201(발급) 또는 정해진 409(/errors/coupon-exhausted)뿐이다.
 * 그 밖의 응답은 원인 예외의 SQL 오류 코드로 나눠 보고한다: 데드락(1213, SQLState 40001)과 그 밖의 실패를 따로 단언한다.
 * 회차마다 MySQL의 데드락 오류 발생 수(performance_schema, root로 조회)가 얼마나 늘었는지도 메시지에 남긴다.
 * 발급 수량(issued_quantity)과 실제 발급 행 수가 어긋나도 실패다.
 */
class B07ConfirmTest extends ApiTestSupport {

    private static final int MEMBERS = 20;
    private static final String EXHAUSTED = "/errors/coupon-exhausted";

    @Autowired
    MySQLContainer mysql;

    @Test
    void 수량_20장을_20명이_동시에_받으면_모두_201이다() throws Exception {
        for (int round = 1; round <= 3; round++) {
            long couponId = newCoupon(MEMBERS);
            long deadlocksBefore = deadlockErrors();

            List<Outcome> outcomes = issueConcurrently(couponId, members(MEMBERS));
            long deadlocks = deadlockErrors() - deadlocksBefore;

            assertNoServerErrors(outcomes, round, deadlocks);
            assertThat(outcomes).as("%d회차 응답(수량이 충분하다)", round).allMatch(o -> o.status() == 201);
            assertThat(issued(couponId)).as("%d회차 issued_quantity", round).isEqualTo(MEMBERS);
            assertThat(owned(couponId)).as("%d회차 발급 행 수", round).isEqualTo(MEMBERS);
        }
    }

    @Test
    void 수량_10장을_20명이_동시에_받으면_10명은_201_나머지는_409다() throws Exception {
        for (int round = 1; round <= 3; round++) {
            long couponId = newCoupon(10);
            long deadlocksBefore = deadlockErrors();

            List<Outcome> outcomes = issueConcurrently(couponId, members(MEMBERS));
            long deadlocks = deadlockErrors() - deadlocksBefore;

            assertNoServerErrors(outcomes, round, deadlocks);
            assertThat(outcomes).as("%d회차 응답", round)
                    .allMatch(o -> o.status() == 201 || (o.status() == 409 && o.body().contains(EXHAUSTED)));
            assertThat(outcomes.stream().filter(o -> o.status() == 201)).as("%d회차 201 수", round).hasSize(10);
            assertThat(issued(couponId)).as("%d회차 issued_quantity", round).isEqualTo(10);
            assertThat(owned(couponId)).as("%d회차 발급 행 수", round).isEqualTo(10);
        }
    }

    /** 201·409가 아닌 응답을 원인별로 나눈다. 데드락이 아닌 실패가 먼저 보이면 이 티켓과 다른 문제다. */
    private static void assertNoServerErrors(List<Outcome> outcomes, int round, long deadlocks) {
        List<Outcome> failed = outcomes.stream().filter(o -> o.status() != 201 && o.status() != 409).toList();
        List<Outcome> deadlockLosers = failed.stream().filter(Outcome::deadlock).toList();
        List<Outcome> others = failed.stream().filter(o -> !o.deadlock()).toList();
        assertThat(others).as("%d회차 데드락(1213)이 아닌 실패", round).isEmpty();
        assertThat(deadlockLosers)
                .as("%d회차 데드락(MySQL 1213, SQLState 40001)으로 실패한 요청(이번 회차 MySQL 데드락 오류 %d건 증가)", round, deadlocks)
                .isEmpty();
    }

    private record Outcome(int status, String body, String cause, boolean deadlock) {
        @Override
        public String toString() {
            return status + " " + cause;
        }
    }

    private static Outcome outcome(MvcResult r) throws Exception {
        Throwable resolved = r.getResolvedException();
        String cause = resolved == null ? "-" : resolved.getClass().getSimpleName();
        boolean deadlock = false;
        for (Throwable c = resolved; c != null; c = c.getCause()) {
            if (c instanceof SQLException e) {
                cause = cause + " <- SQL " + e.getErrorCode() + "/" + e.getSQLState();
                deadlock = e.getErrorCode() == 1213;
                break;
            }
        }
        return new Outcome(r.getResponse().getStatus(), r.getResponse().getContentAsString(), cause, deadlock);
    }

    /** MySQL 서버가 지금까지 낸 1213(ER_LOCK_DEADLOCK) 오류 수. 앱 계정은 performance_schema 권한이 없어 root로 본다. */
    private long deadlockErrors() throws SQLException {
        try (Connection c = DriverManager.getConnection(mysql.getJdbcUrl(), "root", mysql.getPassword());
                Statement st = c.createStatement();
                ResultSet rs = st.executeQuery("SELECT SUM_ERROR_RAISED FROM performance_schema.events_errors_summary_global_by_error"
                        + " WHERE ERROR_NUMBER = 1213")) {
            return rs.next() ? rs.getLong(1) : 0;
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

    private List<Outcome> issueConcurrently(long couponId, List<Member> members) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(members.size());
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<MvcResult>> futures = new ArrayList<>();
            for (Member m : members) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(m)))
                            .andReturn();
                }));
            }
            start.countDown();
            List<Outcome> outcomes = new ArrayList<>();
            for (Future<MvcResult> f : futures) {
                outcomes.add(outcome(f.get(60, TimeUnit.SECONDS)));
            }
            return outcomes;
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
