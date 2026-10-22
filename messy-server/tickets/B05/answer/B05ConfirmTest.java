package com.example.board.tickets;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.Test;

import com.example.board.common.ForbiddenWordChecker;
import com.example.board.config.BoardProperties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * B05 확인 테스트: 금칙어 검사기는 싱글톤 빈이다. 서로 다른 글을 동시에 검사해도 각 글의 결과는 그 글만으로 정해진다.
 *
 * <p>두 스레드가 같은 검사기로 한쪽은 깨끗한 글만, 다른 쪽은 금칙어 글만 정해진 시간 동안 계속 검사한다.
 * 금칙어 글에는 금칙어가 <b>전부</b> 들어 있고 깨끗한 글에는 하나도 없다. 그래서 깨끗한 글 검사가 금칙어 목록을 도는 도중
 * 어느 순간이든 다른 글의 값이 끼어들면, 바로 다음 금칙어에서 결과가 뒤집힌다(금칙어 목록 순서와 상관없다).
 * 깨끗한 글은 길게 만들어 한 번 검사가 목록을 도는 시간을 늘린다. 금칙어 글은 첫 금칙어에서 바로 끝난다.
 */
class B05ConfirmTest {

    private static final int WORDS = 3000;
    private static final long BUDGET_MILLIS = 2000;
    private static final String CLEAN = "오늘 점심은 김치찌개였습니다. 맛있었어요. ".repeat(1500);

    @Test
    void 깨끗한_글과_금칙어_글을_동시에_검사해도_결과가_섞이지_않는다() throws Exception {
        ForbiddenWordChecker checker = new ForbiddenWordChecker(
                new BoardProperties(new BoardProperties.ForbiddenWords(true), null, null));
        List<String> words = new ArrayList<>();
        for (int i = 0; i < WORDS; i++) {
            words.add("광고" + i + "번");
        }
        checker.replaceWords(words);
        String dirty = "광고 문의는 쪽지 주세요. " + String.join(" ", words);
        // 혼자 검사할 때는 맞다
        assertThat(checker.contains(CLEAN)).isFalse();
        assertThat(checker.contains(dirty)).isTrue();

        AtomicBoolean stop = new AtomicBoolean();
        AtomicLong cleanCalls = new AtomicLong();
        AtomicLong dirtyCalls = new AtomicLong();
        AtomicLong cleanWrong = new AtomicLong();
        AtomicLong dirtyWrong = new AtomicLong();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> cleanSide = pool.submit(() -> {
                ready.countDown();
                go.await();
                while (!stop.get()) {
                    cleanCalls.incrementAndGet();
                    if (checker.contains(CLEAN)) {
                        cleanWrong.incrementAndGet();
                        stop.set(true);
                    }
                }
                return null;
            });
            Future<?> dirtySide = pool.submit(() -> {
                ready.countDown();
                go.await();
                while (!stop.get()) {
                    dirtyCalls.incrementAndGet();
                    if (!checker.contains(dirty)) {
                        dirtyWrong.incrementAndGet();
                        stop.set(true);
                    }
                }
                return null;
            });
            ready.await(10, TimeUnit.SECONDS);
            go.countDown();
            long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(BUDGET_MILLIS);
            while (!stop.get() && System.nanoTime() < deadline) {
                Thread.sleep(10);
            }
            stop.set(true);
            cleanSide.get(30, TimeUnit.SECONDS);
            dirtySide.get(30, TimeUnit.SECONDS);
        } finally {
            stop.set(true);
            pool.shutdownNow();
        }

        // 두 검사가 실제로 함께 돌았어야 판정이 의미 있다(한쪽이 한 번도 못 돌았으면 끼어들 상대가 없다)
        assertThat(cleanCalls.get()).as("깨끗한 글 검사 횟수").isPositive();
        assertThat(dirtyCalls.get()).as("금칙어 글 검사 횟수").isPositive();
        assertThat(cleanWrong.get() + dirtyWrong.get())
                .as("동시 검사 %dms 동안 다른 글의 결과가 섞인 횟수(깨끗한 글 %d회 중 금칙어로 판정 %d, 금칙어 글 %d회 중 통과 %d)",
                        BUDGET_MILLIS, cleanCalls.get(), cleanWrong.get(), dirtyCalls.get(), dirtyWrong.get())
                .isZero();
    }
}
