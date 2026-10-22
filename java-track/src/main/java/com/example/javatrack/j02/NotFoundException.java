package com.example.javatrack.j02;

/**
 * 대상이 없을 때 던지는 예외. 에러 코드는 언제나 {@link ErrorCode#NOT_FOUND}다.
 * 메시지는 {@code "찾을 수 없습니다: " + target + " id=" + id} (예: {@code "찾을 수 없습니다: 글 id=42"}).
 */
public class NotFoundException extends BusinessException {

    public NotFoundException(String target, long id) {
        // TODO: 부모 생성자에 알맞은 ErrorCode와 메시지를 넘기세요(super 호출은 생성자의 첫 줄이어야 한다)
        super(null, null);
        throw new UnsupportedOperationException("J02: NotFoundException 생성자 — NOT_FOUND와 메시지를 부모 생성자에 넘기세요");
    }
}
