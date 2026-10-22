package com.example.javatrack.j02;

/**
 * 성공 값 하나 또는 에러 코드·메시지를 담는 결과. {@code T}는 성공 값의 타입이다.
 * <ul>
 *   <li>생성자는 private이다. 밖에서는 static 팩토리 {@link #success}·{@link #failure}로만 만든다</li>
 *   <li>성공이면 {@link #errorCode()}·{@link #message()}가 null이다</li>
 *   <li>실패한 결과에서 {@link #value()}를 꺼내면 {@link IllegalStateException}</li>
 * </ul>
 */
public final class Result<T> {

    private final T value;
    private final ErrorCode errorCode;
    private final String message;

    private Result(T value, ErrorCode errorCode, String message) {
        this.value = value;
        this.errorCode = errorCode;
        this.message = message;
    }

    /** 성공 결과를 만든다. 인스턴스가 없어도 부를 수 있도록 static이다. */
    public static <T> Result<T> success(T value) {
        return new Result<>(value, null, null);
    }

    /** 예외가 가진 에러 코드와 메시지로 실패 결과를 만든다. BusinessException의 자식(NotFoundException 등)도 받는다. */
    public static <T> Result<T> failure(BusinessException e) {
        // 매개변수 타입이 부모라서 자식 예외도 그대로 들어온다. errorCode()는 부모에 정의돼 있다
        return new Result<>(null, e.errorCode(), e.getMessage());
    }

    public boolean isSuccess() {
        return errorCode == null;
    }

    /** 성공 값을 돌려준다. 실패한 결과면 IllegalStateException. */
    public T value() {
        if (!isSuccess()) {
            throw new IllegalStateException("실패한 결과에는 값이 없습니다: " + errorCode);
        }
        return value;
    }

    public ErrorCode errorCode() {
        return errorCode;
    }

    public String message() {
        return message;
    }
}
