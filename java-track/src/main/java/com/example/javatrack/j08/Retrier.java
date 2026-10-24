package com.example.javatrack.j08;

import java.time.Duration;
import java.util.function.Supplier;

/**
 * 재시도 함수. 연결 실패({@link PgUnreachableException})만 다시 시도한다.
 * <ul>
 *   <li>maxAttempts는 첫 시도를 포함한 전체 시도 횟수다. 1보다 작으면 {@link IllegalArgumentException}</li>
 *   <li>다시 시도하기 전에 {@link #FIRST_BACKOFF}(200ms)부터 두 배씩(200ms, 400ms, 800ms …) 기다린다. 마지막 시도 뒤에는 기다리지 않는다</li>
 *   <li>끝까지 실패하면 마지막 예외를 그대로 던진다</li>
 *   <li>그 밖의 예외(거절 등)는 다시 시도하지 않고 바로 던진다</li>
 *   <li>기다리다 인터럽트되면 인터럽트 표시를 되살리고, 더 시도하지 않고 마지막 예외를 던진다</li>
 * </ul>
 */
public class Retrier {

    public static final Duration FIRST_BACKOFF = Duration.ofMillis(200);

    // TODO: 주입받은 Sleeper를 담을 필드를 선언하세요(다시 대입할 일이 없다)

    public Retrier(Sleeper sleeper) {
        throw new UnsupportedOperationException("J08: Retrier 생성자 — 받은 Sleeper를 필드에 담으세요");
    }

    /** call을 최대 maxAttempts번 부른다. 성공하면 그 값을 돌려준다. */
    public <T> T retry(Supplier<T> call, int maxAttempts) {
        throw new UnsupportedOperationException("J08: Retrier.retry — 연결 실패만 백오프를 두고 다시 부르세요");
    }
}
