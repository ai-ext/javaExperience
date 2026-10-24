package com.example.board.payment;

import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;

/**
 * 연결 실패와 5xx만 다시 보낸다. 최대 3회(첫 시도 포함), 백오프 200ms·400ms + 지터 0~100ms.
 * 응답 타임아웃은 PG가 이미 승인했을 수 있으므로 재시도하지 않고 결과 불명으로 넘긴다.
 * 4xx 거절은 같은 요청이 같은 실패를 내므로 재시도하지 않는다.
 */
public class PgRetryPolicy {

    private static final int DEFAULT_MAX_ATTEMPTS = 3;
    private static final long[] BACKOFF_MILLIS = {200, 400};
    private static final int MAX_JITTER_MILLIS = 100;

    private final int maxAttempts;

    public PgRetryPolicy() {
        this(DEFAULT_MAX_ATTEMPTS);
    }

    public PgRetryPolicy(int maxAttempts) {
        if (maxAttempts < 1 || maxAttempts > BACKOFF_MILLIS.length + 1) {
            throw new IllegalArgumentException("maxAttempts: " + maxAttempts);
        }
        this.maxAttempts = maxAttempts;
    }

    public <T> T execute(Supplier<T> call) {
        for (int attempt = 1;; attempt++) {
            try {
                return call.get();
            } catch (PgException e) {
                if (!retryable(e) || attempt >= maxAttempts) {
                    throw e;
                }
                sleep(BACKOFF_MILLIS[attempt - 1] + ThreadLocalRandom.current().nextInt(MAX_JITTER_MILLIS + 1), e);
            }
        }
    }

    static boolean retryable(PgException e) {
        return e.kind() == PgException.Kind.UNREACHABLE || e.kind() == PgException.Kind.SERVER_ERROR;
    }

    private static void sleep(long millis, PgException last) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw last;
        }
    }
}
