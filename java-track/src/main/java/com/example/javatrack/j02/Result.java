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

    // TODO: 성공 값·에러 코드·메시지 필드를 선언하세요(만든 뒤 바뀌지 않게)

    private Result(T value, ErrorCode errorCode, String message) {
        throw new UnsupportedOperationException("J02: Result 생성자 — 세 값을 필드에 담으세요");
    }

    /** 성공 결과를 만든다. 인스턴스가 없어도 부를 수 있도록 static이다. */
    public static <T> Result<T> success(T value) {
        throw new UnsupportedOperationException("J02: Result.success — 값만 담은 Result를 만드세요");
    }

    /** 예외가 가진 에러 코드와 메시지로 실패 결과를 만든다. BusinessException의 자식(NotFoundException 등)도 받는다. */
    public static <T> Result<T> failure(BusinessException e) {
        throw new UnsupportedOperationException("J02: Result.failure — 예외의 에러 코드와 메시지를 담은 Result를 만드세요");
    }

    public boolean isSuccess() {
        throw new UnsupportedOperationException("J02: Result.isSuccess — 에러 코드가 없으면 성공입니다");
    }

    /** 성공 값을 돌려준다. 실패한 결과면 IllegalStateException. */
    public T value() {
        throw new UnsupportedOperationException("J02: Result.value — 성공이면 값을, 실패면 IllegalStateException을 던지세요");
    }

    public ErrorCode errorCode() {
        throw new UnsupportedOperationException("J02: Result.errorCode — 에러 코드 필드를 돌려주세요");
    }

    public String message() {
        throw new UnsupportedOperationException("J02: Result.message — 메시지 필드를 돌려주세요");
    }
}
