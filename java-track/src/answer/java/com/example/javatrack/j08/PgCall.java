package com.example.javatrack.j08;

import java.io.IOException;
import java.util.function.Supplier;

/** PG 호출 한 번. {@link Retrier#retry}에 람다로 넘길 수 있게 체크 예외를 언체크 예외로 바꾼다. */
public final class PgCall {

    private PgCall() {
    }

    /**
     * opener로 채널을 열어 body를 보내고 응답을 돌려준다. 성공하든 실패하든 채널은 반드시 닫는다(try-with-resources).
     * 보내다 난 {@link java.io.IOException}은 원인으로 담아 {@link PgUnreachableException}으로 바꿔 던진다.
     */
    public static String sendOnce(Supplier<PgChannel> opener, String body) {
        // 괄호 안에서 연 자원은 블록을 어떻게 빠져나가든 close된다. close 예외는 원래 예외의 suppressed로 붙는다
        try (PgChannel channel = opener.get()) {
            return channel.send(body);
        } catch (IOException e) {
            // 두 번째 인자로 원인을 넘긴다. 빼면 로그에서 "왜" 실패했는지가 사라진다
            throw new PgUnreachableException("PG 호출 실패: " + e.getMessage(), e);
        }
    }
}
