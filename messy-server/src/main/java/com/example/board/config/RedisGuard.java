package com.example.board.config;

import java.time.Duration;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

/**
 * Redis 호출을 감싸 실패를 호출자에게 올리지 않고 폴백 값으로 바꾼다(경고 로그만 남긴다).
 * 한 번 실패하면 잠시 Redis를 부르지 않는다. 지연 장애 때 명령마다 타임아웃(500ms)을 기다리면
 * 글 작성처럼 Redis를 여러 번 부르는 요청이 1초를 넘기고, 끊김 장애는 REJECT_COMMANDS로 이미 바로 실패한다.
 */
@Component
public class RedisGuard {

    private static final Logger log = LoggerFactory.getLogger(RedisGuard.class);
    static final Duration SKIP_AFTER_FAILURE = Duration.ofSeconds(5);

    // System.nanoTime 기준. 이 시각 전에는 Redis를 건너뛴다.
    private volatile long skipUntil = System.nanoTime();

    public <T> T call(String operation, Supplier<T> action, Supplier<T> fallback) {
        if (skipUntil - System.nanoTime() > 0) {
            return fallback.get();
        }
        try {
            return action.get();
        } catch (DataAccessException e) {
            skipUntil = System.nanoTime() + SKIP_AFTER_FAILURE.toNanos();
            log.warn("Redis {} 실패, {}초 동안 Redis 없이 처리한다: {}", operation, SKIP_AFTER_FAILURE.toSeconds(),
                    e.toString());
            return fallback.get();
        }
    }

    public void run(String operation, Runnable action) {
        call(operation, () -> {
            action.run();
            return null;
        }, () -> null);
    }

    /** 건너뛰기를 끝낸다. 장애 주입 테스트가 다음 테스트에 상태를 남기지 않게 할 때 쓴다. */
    public void reset() {
        skipUntil = System.nanoTime();
    }
}
