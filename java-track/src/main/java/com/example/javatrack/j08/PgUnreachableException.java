package com.example.javatrack.j08;

/**
 * 주어진 예외: 고치지 않는다.
 * PG에 연결하지 못했다. 요청이 PG에 닿지 않았으므로 같은 멱등 키로 다시 보내도 된다(재시도 대상).
 */
public class PgUnreachableException extends RuntimeException {

    public PgUnreachableException(String message) {
        super(message);
    }

    public PgUnreachableException(String message, Throwable cause) {
        super(message, cause);
    }
}
