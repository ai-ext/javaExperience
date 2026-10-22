package com.example.board.point;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.example.board.common.BusinessException;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PointConcurrencyTest extends ApiTestSupport {

    @Autowired
    PointService pointService;

    long balance(Member m) {
        return jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId());
    }

    long ledgerSum(Member m) {
        return jdbc.queryForObject("SELECT COALESCE(SUM(amount), 0) FROM point_ledger WHERE member_id = ?", Long.class,
                m.getId());
    }

    int ledgerRows(Member m) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM point_ledger WHERE member_id = ?", Integer.class, m.getId());
    }

    // 함정: 잔액을 읽어 더한 뒤 저장하면 동시 적립에서 갱신이 사라진다
    @Test
    void 같은_회원에게_동시에_50번_적립하면_잔액은_500이고_ledger는_50행이다() throws Exception {
        Member m = newMember(Role.USER);
        runConcurrently(50, () -> pointService.earn(m.getId(), 10, "TEST", null));

        assertThat(balance(m)).isEqualTo(500);
        assertThat(ledgerRows(m)).isEqualTo(50);
        assertThat(balance(m)).isEqualTo(ledgerSum(m));
    }

    @Test
    void 적립_뒤_balance_after는_그_시점_잔액이다() {
        Member m = newMember(Role.USER);
        pointService.earn(m.getId(), 10, "POST", 1L);
        pointService.earn(m.getId(), 2, "COMMENT", 2L);

        assertThat(jdbc.queryForList("SELECT balance_after FROM point_ledger WHERE member_id = ? ORDER BY id",
                Long.class, m.getId())).containsExactly(10L, 12L);
    }

    @Test
    void 차감은_잔액이_모자라면_예외이고_이력도_남기지_않는다() {
        Member m = newMember(Role.USER);
        pointService.earn(m.getId(), 10, "TEST", null);

        assertThatThrownBy(() -> pointService.spend(m.getId(), 11, "ORDER", 1L)).isInstanceOf(BusinessException.class);

        assertThat(balance(m)).isEqualTo(10);
        assertThat(ledgerRows(m)).isEqualTo(1);
    }

    @Test
    void 동시에_차감해도_잔액은_0_아래로_내려가지_않고_성공한_만큼만_이력이_남는다() throws Exception {
        Member m = newMember(Role.USER);
        pointService.earn(m.getId(), 100, "TEST", null);

        List<Boolean> results = runConcurrently(20, () -> {
            try {
                pointService.spend(m.getId(), 10, "ORDER", null);
                return true;
            } catch (BusinessException e) {
                return false;
            }
        });

        assertThat(results.stream().filter(b -> b)).hasSize(10);
        assertThat(balance(m)).isZero();
        assertThat(balance(m)).isEqualTo(ledgerSum(m));
    }

    private <T> List<T> runConcurrently(int n, java.util.concurrent.Callable<T> task) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(n);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<T>> futures = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return task.call();
                }));
            }
            start.countDown();
            List<T> result = new ArrayList<>();
            for (Future<T> f : futures) {
                result.add(f.get());
            }
            return result;
        } finally {
            pool.shutdownNow();
        }
    }

    private void runConcurrently(int n, Runnable task) throws Exception {
        runConcurrently(n, () -> {
            task.run();
            return null;
        });
    }
}
