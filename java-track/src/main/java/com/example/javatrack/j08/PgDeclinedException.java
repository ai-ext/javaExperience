package com.example.javatrack.j08;

/**
 * 주어진 예외: 고치지 않는다.
 * PG가 승인을 거절했다. 같은 요청은 같은 실패를 내므로 다시 보내지 않는다.
 */
public class PgDeclinedException extends RuntimeException {

    public PgDeclinedException(String message) {
        super(message);
    }
}
