package com.example.board.common;

import org.springframework.http.HttpStatus;

/** 에러 종류. type URI는 spec-v2 §5와 같다. */
public enum ErrorCode {
    VALIDATION(HttpStatus.BAD_REQUEST, "/errors/validation", "검증 실패"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "/errors/not-found", "대상 없음"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "/errors/forbidden", "권한 없음"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "/errors/unauthorized", "인증 필요"),
    DUPLICATE(HttpStatus.CONFLICT, "/errors/duplicate", "중복"),
    TOO_MANY_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "/errors/too-many-attempts", "시도 횟수 초과"),
    COUPON_EXHAUSTED(HttpStatus.CONFLICT, "/errors/coupon-exhausted", "쿠폰 소진"),
    COUPON_UNUSABLE(HttpStatus.CONFLICT, "/errors/coupon-unusable", "쿠폰 사용 불가"),
    OUT_OF_STOCK(HttpStatus.CONFLICT, "/errors/out-of-stock", "재고 부족"),
    INSUFFICIENT_POINTS(HttpStatus.CONFLICT, "/errors/insufficient-points", "포인트 부족"),
    IDEMPOTENCY_MISMATCH(HttpStatus.UNPROCESSABLE_ENTITY, "/errors/idempotency-mismatch", "멱등 키 본문 불일치"),
    PG_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "/errors/pg-timeout", "PG 시간 초과"),
    PG_DECLINED(HttpStatus.BAD_GATEWAY, "/errors/pg-declined", "PG 승인 거절"),
    INVALID_SIGNATURE(HttpStatus.UNAUTHORIZED, "/errors/invalid-signature", "서명 불일치");

    private final HttpStatus status;
    private final String type;
    private final String title;

    ErrorCode(HttpStatus status, String type, String title) {
        this.status = status;
        this.type = type;
        this.title = title;
    }

    public HttpStatus status() {
        return status;
    }

    public String type() {
        return type;
    }

    public String title() {
        return title;
    }
}
