package com.example.javatrack.j08;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import org.junit.jupiter.api.Test;

/** 실무 습관: 예외 원인 연결과 삼키기 — new XxxException(msg, e)로 원인을 남긴다. */
class J08HabitTest {

    @Test
    void 빈_catch는_실패를_null로_숨기고_PgCall은_예외로_드러낸다() {
        // 빈 catch: PG가 응답하지 않았는데도 호출한 쪽은 null만 받는다. "응답이 비었다"와 구분할 수 없다
        String swallowed = LeakyPgCall.sendSwallowing(
                () -> FakePgChannel.failing(new IOException("connection refused")), "{}");
        assertThat(swallowed).isNull();

        assertThatThrownBy(() -> PgCall.sendOnce(
                () -> FakePgChannel.failing(new IOException("connection refused")), "{}"))
                .isInstanceOf(PgUnreachableException.class);
    }

    @Test
    void 원인_없이_새_예외를_던지면_원래_IOException이_사라진다_PgCall은_원인으로_남긴다() {
        IOException original = new IOException("connection reset");

        Throwable leaky = catchThrowable(() -> LeakyPgCall.sendWithoutCause(() -> FakePgChannel.failing(original), "{}"));
        assertThat(leaky).isInstanceOf(PgUnreachableException.class);
        // "PG 호출 실패"만 남고, 연결 거부인지 리셋인지 타임아웃인지 알 수 없다
        assertThat(leaky.getCause()).isNull();

        Throwable chained = catchThrowable(() -> PgCall.sendOnce(() -> FakePgChannel.failing(original), "{}"));
        assertThat(chained).isInstanceOf(PgUnreachableException.class);
        assertThat(chained.getCause()).isSameAs(original);
    }

    @Test
    void 원인을_이어_두면_스택_트레이스에_Caused_by로_원래_예외가_찍힌다() {
        Throwable chained = catchThrowable(() -> PgCall.sendOnce(
                () -> FakePgChannel.failing(new IOException("connection reset")), "{}"));
        assertThat(chained).isInstanceOf(PgUnreachableException.class);

        // 장애 때 로그에서 보게 되는 모양 그대로 확인한다
        StringWriter log = new StringWriter();
        chained.printStackTrace(new PrintWriter(log));

        assertThat(log.toString()).contains("Caused by: java.io.IOException: connection reset");
    }
}
