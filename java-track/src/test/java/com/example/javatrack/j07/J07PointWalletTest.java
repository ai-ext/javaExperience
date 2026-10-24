package com.example.javatrack.j07;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

/**
 * 주제 과제: 스레드와 공유 상태 — 잔액 갱신 손실을 순수 Java로 재현하고 synchronized·AtomicInteger로 고치기,
 * ConcurrentHashMap·스레드 안전한 Set.
 * 손실은 확률에 맡기지 않는다. 지갑이 읽기와 쓰기 사이에 부르는 틈(betweenReadAndWrite)에서
 * 두 스레드가 모두 읽을 때까지 기다리게 해, 둘이 같은 옛 잔액을 읽는 상황을 매번 만든다.
 * 잠그는 지갑(synchronized)과 잠그지 않는 지갑(CAS)은 틈에서 일어나는 일이 달라서 틈도 따로 둔다.
 */
@Timeout(10)
class J07PointWalletTest {

    /**
     * 잠그는 지갑용 틈: 두 스레드가 모두 이 자리에 올 때까지 최대 waitMillis 기다리고, 기다림이 제때 끝났는지(true)
     * 시간 초과였는지(false)를 met에 남긴다. synchronized 지갑에서는 먼저 들어온 스레드가 잠금을 쥔 채 기다리므로
     * 다른 스레드가 이 자리에 오지 못해 시간 초과(false)가 하나 나온다.
     */
    private static Runnable latchGap(CountDownLatch bothRead, ConcurrentLinkedQueue<Boolean> met, long waitMillis) {
        return () -> {
            bothRead.countDown();
            try {
                met.add(bothRead.await(waitMillis, TimeUnit.MILLISECONDS));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("틈에서 기다리다 끊겼습니다", e);
            }
        };
    }

    /**
     * CAS 지갑용 틈: 첫 두 번(두 스레드의 첫 읽기)은 barrier에서 서로를 반드시 기다린다. 그래서 둘 다 같은 0을 읽은 채로
     * compareAndSet에 들어간다. 세 번째부터(재시도 읽기)는 기다리지 않는다. 기다림이 시간 초과면 예외로 테스트를 깬다.
     */
    private static Runnable firstReadsMeet(CyclicBarrier firstReads, AtomicInteger calls) {
        return () -> {
            if (calls.incrementAndGet() > 2) {
                return;
            }
            try {
                firstReads.await(5, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("첫 읽기에서 기다리다 끊겼습니다", e);
            } catch (BrokenBarrierException | TimeoutException e) {
                throw new IllegalStateException("두 스레드가 첫 읽기에서 만나지 못했습니다", e);
            }
        };
    }

    /** 같은 작업을 여러 스레드에서 동시에 돌리고, 스레드 안에서 난 예외는 테스트 실패로 올린다. */
    private static <T> List<T> runConcurrently(int threads, Callable<T> task) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<T>> futures = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return task.call();
                }));
            }
            start.countDown();
            List<T> results = new ArrayList<>();
            for (Future<T> future : futures) {
                results.add(future.get(5, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void 함정_읽고_쓰는_사이에_다른_스레드가_끼면_적립_하나가_사라진다_synchronized는_막는다() throws Exception {
        ConcurrentLinkedQueue<Boolean> leakyMet = new ConcurrentLinkedQueue<>();
        LeakyPointWallet leaky = new LeakyPointWallet(latchGap(new CountDownLatch(2), leakyMet, 5_000));
        runConcurrently(2, () -> {
            leaky.earn(10);
            return null;
        });
        // 두 스레드가 틈에서 제때 만났다(둘 다 true) = 둘 다 0을 읽은 뒤 썼다
        assertThat(leakyMet).containsExactly(true, true);
        // 두 스레드 모두 0을 읽고 0 + 10을 썼다. 10 + 10 = 20이어야 하는데 한 번이 사라졌다
        assertThat(leaky.balance()).isEqualTo(10);

        ConcurrentLinkedQueue<Boolean> met = new ConcurrentLinkedQueue<>();
        SynchronizedPointWallet wallet = new SynchronizedPointWallet(latchGap(new CountDownLatch(2), met, 300));
        runConcurrently(2, () -> {
            wallet.earn(10);
            return null;
        });

        assertThat(wallet.balance()).isEqualTo(20);
        // 틈을 거치지 않으면 이 테스트는 아무것도 확인하지 못한다. 두 번 모두 틈을 지나야 한다.
        // 먼저 들어온 스레드는 잠금을 쥔 채 기다리다 시간 초과(false), 뒤 스레드는 잠금이 풀린 뒤 들어와 바로 통과(true)
        assertThat(met).containsExactly(false, true);
    }

    @Test
    void AtomicInteger는_compareAndSet이_실패하면_다시_읽어_손실이_없다() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        AtomicPointWallet wallet = new AtomicPointWallet(firstReadsMeet(new CyclicBarrier(2), calls));

        runConcurrently(2, () -> {
            wallet.earn(10);
            return null;
        });

        assertThat(wallet.balance()).isEqualTo(20);
        // 두 스레드가 같은 0을 읽었으므로 compareAndSet(0, 10)은 한쪽만 성공한다.
        // 실패한 쪽은 다시 읽어(10) 한 번 더 틈을 지난다: 첫 읽기 2번 + 재시도 읽기 1번 = 정확히 3번.
        // 2번이면 재시도 없이 끝났다는 뜻이다(compareAndSet 결과를 무시했거나 다시 읽지 않았다)
        assertThat(calls.get()).isEqualTo(3);
    }

    @Test
    void 여러_스레드가_천_번씩_적립해도_synchronized와_AtomicInteger는_합계가_맞다() throws Exception {
        Runnable noGap = () -> {
        };
        SynchronizedPointWallet synchronizedWallet = new SynchronizedPointWallet(noGap);
        AtomicPointWallet atomicWallet = new AtomicPointWallet(noGap);

        runConcurrently(8, () -> {
            for (int i = 0; i < 1_000; i++) {
                synchronizedWallet.earn(1);
                atomicWallet.earn(1);
            }
            return null;
        });

        assertThat(synchronizedWallet.balance()).isEqualTo(8_000);
        assertThat(atomicWallet.balance()).isEqualTo(8_000);
    }

    @Test
    void ConcurrentHashMap_merge로_회원별_포인트를_동시에_더해도_맞다() throws Exception {
        MemberPoints points = new MemberPoints();

        runConcurrently(8, () -> {
            for (int i = 0; i < 1_000; i++) {
                points.earn(i % 4, 10); // 회원 0~3에 번갈아 적립
            }
            return null;
        });

        // 스레드 8개 × 회원마다 250번 × 10점
        for (long memberId = 0; memberId < 4; memberId++) {
            assertThat(points.balanceOf(memberId)).isEqualTo(8 * 250 * 10L);
        }
    }

    @Test
    void 적립한_적이_없는_회원의_잔액은_0이다() {
        MemberPoints points = new MemberPoints();
        points.earn(1, 100);

        assertThat(points.balanceOf(1)).isEqualTo(100);
        assertThat(points.balanceOf(99)).isZero();
    }

    @Test
    void Set_add는_이미_있으면_false라_1인_1매를_지킨다() {
        CouponIssuer issuer = new CouponIssuer();

        assertThat(issuer.issue(1)).isTrue();
        assertThat(issuer.issue(1)).isFalse();
        assertThat(issuer.issue(2)).isTrue();
        assertThat(issuer.issuedCount()).isEqualTo(2);
    }

    @Test
    void 같은_회원이_동시에_여러_번_요청해도_한_장만_발급된다() throws Exception {
        CouponIssuer issuer = new CouponIssuer();

        List<Boolean> results = runConcurrently(16, () -> issuer.issue(1));

        assertThat(results).containsOnlyOnce(true);
        assertThat(issuer.issuedCount()).isEqualTo(1);
    }
}
