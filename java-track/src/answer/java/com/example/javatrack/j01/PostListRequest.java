package com.example.javatrack.j01;

/**
 * GET /api/posts의 size 파라미터를 담는 요청 DTO.
 * 클라이언트가 size를 보내지 않으면 null이 들어온다. 보냈다면 1~{@value #MAX_SIZE}여야 한다(0도 잘못된 값).
 */
public record PostListRequest(Integer size) {

    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 50;

    /** 보낸 size가 1~MAX_SIZE인지 검사한다. 보내지 않은 null은 통과시킨다. 어기면 IllegalArgumentException. */
    public PostListRequest {
        // null(보내지 않음)을 먼저 걸러야 size < 1 비교에서 언박싱 NPE가 나지 않는다
        if (size != null && (size < 1 || size > MAX_SIZE)) {
            throw new IllegalArgumentException("size는 1~50이어야 합니다: " + size);
        }
    }

    /** 보내지 않았으면 DEFAULT_SIZE, 보냈으면 그 값을 돌려준다. */
    public int sizeOrDefault() {
        return size == null ? DEFAULT_SIZE : size;
    }
}
