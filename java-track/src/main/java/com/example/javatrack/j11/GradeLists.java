package com.example.javatrack.j11;

import java.util.List;

/** 타입 한 컷: 레거시가 돌려준 배열을 List로 옮긴다. */
public final class GradeLists {

    private GradeLists() {
    }

    /**
     * 배열을 원소를 더하고 바꿀 수 있는 List로 옮긴다.
     * 돌려준 List와 받은 배열은 서로 연결되지 않는다(한쪽을 바꿔도 다른 쪽은 그대로다).
     */
    public static List<String> toModifiableList(String[] names) {
        throw new UnsupportedOperationException("J11: GradeLists.toModifiableList — 배열과 연결이 끊긴, 크기를 바꿀 수 있는 List를 만드세요");
    }

    /** int 배열의 원소를 같은 순서로 담은 {@code List<Integer>}를 돌려준다. 원소 수는 배열 길이와 같다. */
    public static List<Integer> toIntegerList(int[] values) {
        throw new UnsupportedOperationException("J11: GradeLists.toIntegerList — int 원소를 하나씩 Integer로 담으세요");
    }
}
