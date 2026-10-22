package com.example.javatrack.j02;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link Post}와 비교하려고 둔다.
 * id를 기본형 {@code long}으로 선언했다. 기본형은 null을 담을 수 없어서 저장 전에도 0이 들어 있다.
 */
public class PrimitiveIdPost {

    private long id;
    private final String title;

    public PrimitiveIdPost(String title) {
        this.title = title;
    }

    public long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }
}
