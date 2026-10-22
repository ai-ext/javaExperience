package com.example.board.tickets;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

import com.example.board.common.ForbiddenWordChecker;
import com.example.board.config.BoardProperties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * B05 확인 테스트: 금칙어 검사기는 싱글톤 빈이다. 서로 다른 글을 동시에 검사해도 각 글의 결과는 그 글만으로 정해진다.
 * 매 회차 CyclicBarrier로 "깨끗한 글" 검사 2개와 "금칙어가 든 글" 검사 2개를 같은 순간에 출발시킨다.
 */
class B05ConfirmTest {

    private static final int ROUNDS = 3000;
    private static final String CLEAN = "오늘 점심은 김치찌개였습니다. 맛있었어요. ".repeat(20);
    private static final String DIRTY = "광고 문의는 쪽지 주세요. ".repeat(20) + "금칙어299";

    @Test
    void 깨끗한_글과_금칙어_글을_동시에_검사해도_결과가_섞이지_않는다() throws Exception {
        ForbiddenWordChecker checker = new ForbiddenWordChecker(
                new BoardProperties(new BoardProperties.ForbiddenWords(true), null, null));
        List<String> words = new ArrayList<>();
        for (int i = 0; i < 300; i++) {
            words.add("금칙어" + i);
        }
        checker.replaceWords(words);
        // 혼자 검사할 때는 맞다
        assertThat(checker.contains(CLEAN)).isFalse();
        assertThat(checker.contains(DIRTY)).isTrue();

        int threads = 4;
        CyclicBarrier barrier = new CyclicBarrier(threads);
        AtomicInteger wrong = new AtomicInteger();
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        try {
            List<Future<?>> futures = new ArrayList<>();
            for (int t = 0; t < threads; t++) {
                boolean dirty = t % 2 == 1;
                futures.add(pool.submit(() -> {
                    for (int r = 0; r < ROUNDS; r++) {
                        barrier.await(10, TimeUnit.SECONDS);
                        if (checker.contains(dirty ? DIRTY : CLEAN) != dirty) {
                            wrong.incrementAndGet();
                        }
                    }
                    return null;
                }));
            }
            for (Future<?> f : futures) {
                f.get(120, TimeUnit.SECONDS);
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(wrong.get()).as("%d회 x %d스레드 중 다른 글의 결과가 섞인 횟수", ROUNDS, threads).isZero();
    }
}
