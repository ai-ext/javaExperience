package com.example.javatrack.j02;

/**
 * 주어진 enum: 고치지 않는다.
 * 에러 종류마다 HTTP 상태와 문제 유형(type) 경로를 묶어 둔다. board-server의 {@code ErrorCode}를 줄인 모양이다.
 */
public enum ErrorCode {
    VALIDATION(400, "/errors/validation"),
    NOT_FOUND(404, "/errors/not-found"),
    FORBIDDEN(403, "/errors/forbidden"),
    DUPLICATE(409, "/errors/duplicate");

    private final int status;
    private final String type;

    ErrorCode(int status, String type) {
        this.status = status;
        this.type = type;
    }

    public int status() {
        return status;
    }

    public String type() {
        return type;
    }
}
