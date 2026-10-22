package com.example.board.payment;

/** PG 호출 실패를 "요청이 PG에 닿았는가"로 나눈다. 재시도와 상태 결정이 이 구분에 달려 있다. */
public class PgException extends RuntimeException {

    public enum Kind {
        /** 연결을 맺지 못했다. PG는 요청을 받지 않았다. */
        UNREACHABLE,
        /** 우리 커넥션 풀에서 빈 커넥션을 얻지 못했다. 요청을 보내지 않았다. */
        POOL_TIMEOUT,
        /** 요청은 보냈지만 응답을 받지 못했다. PG는 승인했을 수 있다(결과 불명). */
        TIMEOUT,
        /** PG가 5xx로 답했다. */
        SERVER_ERROR,
        /** PG가 4xx로 거절했다. 같은 요청은 같은 실패를 낸다. */
        DECLINED
    }

    private final Kind kind;

    public PgException(Kind kind, String message, Throwable cause) {
        super(message, cause);
        this.kind = kind;
    }

    public Kind kind() {
        return kind;
    }
}
