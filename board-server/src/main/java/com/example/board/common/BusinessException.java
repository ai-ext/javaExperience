package com.example.board.common;

public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;
    // 어느 입력 필드의 검증 실패인지. 있으면 응답에 errors[{field, reason=detail}]를 담는다(spec-v2 5절).
    private final String field;

    public BusinessException(ErrorCode errorCode, String detail) {
        this(errorCode, detail, null);
    }

    public BusinessException(ErrorCode errorCode, String detail, String field) {
        super(detail);
        this.errorCode = errorCode;
        this.field = field;
    }

    public ErrorCode errorCode() {
        return errorCode;
    }

    public String field() {
        return field;
    }
}
