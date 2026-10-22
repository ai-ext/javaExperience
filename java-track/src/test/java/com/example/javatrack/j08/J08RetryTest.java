package com.example.javatrack.j08;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** 주제 과제: 체크·언체크 예외, try-with-resources, 람다와 함수형 인터페이스 — 재시도 함수 retry(Supplier, int). */
class J08RetryTest {

    // 실제로 기다리지 않고 기다리라고 받은 시간만 적어 둔다(테스트가 느려지지 않는다)
    private final List<Duration> sleeps = new ArrayList<>();

    private Retrier retrier() {
        return new Retrier(sleeps::add);
    }

    @Test
    void 첫_시도에_성공하면_한_번만_부르고_기다리지_않는다() {
        AtomicInteger calls = new AtomicInteger();

        String result = retrier().retry(() -> {
            calls.incrementAndGet();
            return "DONE";
        }, 3);

        assertThat(result).isEqualTo("DONE");
        assertThat(calls).hasValue(1);
        assertThat(sleeps).isEmpty();
    }

    @Test
    void 연결_실패_뒤_성공하면_그_값을_돌려주고_200ms_400ms를_기다린다() {
        AtomicInteger calls = new AtomicInteger();

        String result = retrier().retry(() -> {
            if (calls.incrementAndGet() < 3) {
                throw new PgUnreachableException("연결 실패 " + calls.get());
            }
            return "DONE";
        }, 3);

        assertThat(result).isEqualTo("DONE");
        assertThat(calls).hasValue(3);
        assertThat(sleeps).containsExactly(Duration.ofMillis(200), Duration.ofMillis(400));
    }

    @Test
    void 끝까지_실패하면_마지막_예외를_그대로_던지고_마지막_시도_뒤에는_기다리지_않는다() {
        Retrier retrier = retrier();
        List<PgUnreachableException> thrown = new ArrayList<>();

        Throwable last = catchThrowable(() -> retrier.retry(() -> {
            PgUnreachableException e = new PgUnreachableException("연결 실패 " + (thrown.size() + 1));
            thrown.add(e);
            throw e;
        }, 4));

        assertThat(thrown).hasSize(4);
        assertThat(last).isSameAs(thrown.get(3));
        assertThat(sleeps).containsExactly(Duration.ofMillis(200), Duration.ofMillis(400), Duration.ofMillis(800));
    }

    @Test
    void 거절은_다시_보내지_않고_기다리지도_않는다() {
        Retrier retrier = retrier();
        AtomicInteger calls = new AtomicInteger();
        PgDeclinedException declined = new PgDeclinedException("한도 초과");

        assertThatThrownBy(() -> retrier.retry(() -> {
            calls.incrementAndGet();
            throw declined;
        }, 3))
                .isSameAs(declined);

        assertThat(calls).hasValue(1);
        assertThat(sleeps).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1})
    void 시도_횟수가_1보다_작으면_한_번도_부르지_않고_거절한다(int maxAttempts) {
        Retrier retrier = retrier();
        AtomicInteger calls = new AtomicInteger();

        assertThatThrownBy(() -> retrier.retry(calls::incrementAndGet, maxAttempts))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(calls).hasValue(0);
    }

    @Test
    void 기다리다_인터럽트되면_인터럽트_표시를_되살리고_마지막_예외를_던진다() {
        Retrier interrupted = new Retrier(d -> {
            throw new InterruptedException("종료 신호");
        });
        AtomicInteger calls = new AtomicInteger();
        PgUnreachableException first = new PgUnreachableException("연결 실패");

        try {
            assertThatThrownBy(() -> interrupted.retry(() -> {
                calls.incrementAndGet();
                throw first;
            }, 3))
                    .isSameAs(first);
            // 더 시도하지 않았다
            assertThat(calls).hasValue(1);
            // InterruptedException을 잡으면 인터럽트 표시가 지워진다. 되살려야 위쪽 코드가 종료 신호를 안다
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
        } finally {
            // 다른 테스트에 인터럽트 표시가 남지 않게 지운다
            Thread.interrupted();
        }
    }

    @Test
    void 보내고_나면_채널이_닫힌다() {
        FakePgChannel channel = FakePgChannel.responding("APPROVED");

        String response = PgCall.sendOnce(() -> channel, "{\"amount\":10000}");

        assertThat(response).isEqualTo("APPROVED");
        assertThat(channel.isClosed()).isTrue();
    }

    @Test
    void 보내다_IOException이_나도_채널은_닫히고_언체크_예외로_바뀐다() {
        FakePgChannel channel = FakePgChannel.failing(new IOException("connection refused"));

        assertThatThrownBy(() -> PgCall.sendOnce(() -> channel, "{}"))
                .isInstanceOf(PgUnreachableException.class);
        assertThat(channel.isClosed()).isTrue();
    }

    @Test
    void 닫다가_난_예외는_원래_예외를_가리지_않고_suppressed로_붙는다() {
        IOException sendFailure = new IOException("connection reset");
        IllegalStateException closeFailure = new IllegalStateException("이미 끊긴 연결");
        FakePgChannel channel = FakePgChannel.failingTwice(sendFailure, closeFailure);

        assertThatThrownBy(() -> PgCall.sendOnce(() -> channel, "{}"))
                .isInstanceOf(PgUnreachableException.class)
                .cause()
                .isSameAs(sendFailure);
        // try-with-resources는 close 예외를 버리지 않고 원래 예외 뒤에 붙인다
        assertThat(sendFailure.getSuppressed()).containsExactly(closeFailure);
    }

    @Test
    void 체크_예외를_바꿔_주면_sendOnce를_retry에_람다로_넘길_수_있다() {
        FakePgChannel broken = FakePgChannel.failing(new IOException("connection refused"));
        FakePgChannel healthy = FakePgChannel.responding("APPROVED");
        Iterator<FakePgChannel> channels = List.of(broken, healthy).iterator();
        Supplier<PgChannel> opener = channels::next;

        // Supplier.get()은 체크 예외를 던질 수 없다. sendOnce가 IOException을 바꿔 주기 때문에 람다로 넘길 수 있다
        String response = retrier().retry(() -> PgCall.sendOnce(opener, "{}"), 3);

        assertThat(response).isEqualTo("APPROVED");
        assertThat(broken.isClosed()).isTrue();
        assertThat(healthy.isClosed()).isTrue();
        assertThat(sleeps).containsExactly(Duration.ofMillis(200));
    }
}
