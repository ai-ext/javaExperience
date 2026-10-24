package com.example.javatrack.j08;

import java.io.IOException;

/**
 * 주어진 인터페이스: 고치지 않는다.
 * PG와 맺은 연결 하나. 쓰고 나면 반드시 닫아야 한다({@link AutoCloseable}이라 try-with-resources에 넣을 수 있다).
 */
public interface PgChannel extends AutoCloseable {

    /** 본문을 보내고 응답 본문을 받는다. 네트워크 오류는 체크 예외 {@link IOException}으로 알린다. */
    String send(String body) throws IOException;

    /** 연결을 닫는다. 체크 예외는 던지지 않지만, 이미 끊긴 연결이면 언체크 예외가 날 수 있다. */
    @Override
    void close();
}
