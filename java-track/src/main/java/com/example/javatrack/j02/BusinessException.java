package com.example.javatrack.j02;

/**
 * 업무 규칙을 어겼을 때 던지는 예외의 부모. {@link ErrorCode}를 들고 다녀서, 받는 쪽(전역 예외 처리기)이 코드만 보고 응답을 만든다.
 * {@link RuntimeException}을 상속하므로 언체크 예외다. 메서드에 {@code throws}를 적지 않아도 던질 수 있다.
 */
public class BusinessException extends RuntimeException {

    // TODO: 에러 코드 필드를 선언하세요(만든 뒤 바뀌지 않게)

    /** detail은 예외 메시지({@link #getMessage()})가 된다. 부모 생성자에 넘기세요. */
    public BusinessException(ErrorCode errorCode, String detail) {
        throw new UnsupportedOperationException("J02: BusinessException 생성자 — 메시지는 부모에게 넘기고 에러 코드는 필드에 담으세요");
    }

    public ErrorCode errorCode() {
        throw new UnsupportedOperationException("J02: BusinessException.errorCode — 에러 코드 필드를 돌려주세요");
    }
}
