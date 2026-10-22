package com.example.javatrack.j08;

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
        throw new UnsupportedOperationException("J08: PgCall.sendOnce — try-with-resources로 보내고, IOException은 원인을 담아 바꾸세요");
    }
}
