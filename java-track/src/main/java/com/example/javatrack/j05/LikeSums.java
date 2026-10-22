package com.example.javatrack.j05;

import java.util.List;

/** 타입 한 컷: 제네릭에는 래퍼만 들어간다. 합계는 기본형 stream으로. */
public final class LikeSums {

    private LikeSums() {
    }

    /** 모든 글의 좋아요 합계. 좋아요가 많아도 넘치지 않게 long으로 더한다. */
    public static long totalLikes(List<Post> posts) {
        throw new UnsupportedOperationException("J05: LikeSums.totalLikes — mapToLong으로 바꿔 sum하세요");
    }

    /** counts에서 value와 같은 값을 하나(처음 것) 지운다. 위치(index)가 아니라 값으로 지운다. */
    public static void removeValue(List<Integer> counts, int value) {
        throw new UnsupportedOperationException("J05: LikeSums.removeValue — remove(int)는 위치로 지운다. Integer로 넘기세요");
    }
}
