package com.example.javatrack.j11;

import java.util.ArrayList;
import java.util.Arrays;
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
        // Arrays.asList는 배열 위에 씌운 고정 크기 뷰다. ArrayList로 한 번 더 복사해 배열과 연결을 끊는다
        return new ArrayList<>(Arrays.asList(names));
    }

    /** int 배열의 원소를 같은 순서로 담은 {@code List<Integer>}를 돌려준다. 원소 수는 배열 길이와 같다. */
    public static List<Integer> toIntegerList(int[] values) {
        // Arrays.asList(int[])는 List<int[]>(원소 1개)가 된다. 기본형 배열은 stream으로 하나씩 박싱한다
        return Arrays.stream(values).boxed().toList();
    }
}
