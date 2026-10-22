package com.example.javatrack.j02;

/**
 * 대상이 없을 때 던지는 예외. 에러 코드는 언제나 {@link ErrorCode#NOT_FOUND}다.
 * 메시지는 {@code "찾을 수 없습니다: " + target + " id=" + id} (예: {@code "찾을 수 없습니다: 글 id=42"}).
 */
public class NotFoundException extends BusinessException {

    public NotFoundException(String target, long id) {
        // 자식은 부모 생성자에 값을 넘겨 부모 필드를 채운다. 코드는 자식이 정해 두므로 호출하는 쪽은 대상과 id만 안다
        super(ErrorCode.NOT_FOUND, "찾을 수 없습니다: " + target + " id=" + id);
    }
}
