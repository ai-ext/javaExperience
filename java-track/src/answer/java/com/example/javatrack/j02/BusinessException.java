package com.example.javatrack.j02;

/**
 * 업무 규칙을 어겼을 때 던지는 예외의 부모. {@link ErrorCode}를 들고 다녀서, 받는 쪽(전역 예외 처리기)이 코드만 보고 응답을 만든다.
 * {@link RuntimeException}을 상속하므로 언체크 예외다. 메서드에 {@code throws}를 적지 않아도 던질 수 있다.
 */
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    /** detail은 예외 메시지({@link #getMessage()})가 된다. 부모 생성자에 넘기세요. */
    public BusinessException(ErrorCode errorCode, String detail) {
        // 메시지는 부모(RuntimeException)가 보관한다. super 호출은 생성자의 첫 줄이어야 한다
        super(detail);
        this.errorCode = errorCode;
    }

    public ErrorCode errorCode() {
        return errorCode;
    }
}
