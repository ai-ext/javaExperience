package com.example.javatrack.j05;

import java.util.List;

/** 타입 한 컷: 제네릭에는 래퍼만 들어간다. 합계는 기본형 stream으로. */
public final class LikeSums {

    private LikeSums() {
    }

    /** 모든 글의 좋아요 합계. 좋아요가 많아도 넘치지 않게 long으로 더한다. */
    public static long totalLikes(List<Post> posts) {
        // Stream<Post> → LongStream. 기본형 stream이라 박싱 없이 sum()을 바로 쓴다
        return posts.stream().mapToLong(Post::getLikeCount).sum();
    }

    /** counts에서 value와 같은 값을 하나(처음 것) 지운다. 위치(index)가 아니라 값으로 지운다. */
    public static void removeValue(List<Integer> counts, int value) {
        // remove(int)는 위치, remove(Object)는 값이다. Integer로 감싸야 값으로 지우는 쪽이 불린다
        counts.remove(Integer.valueOf(value));
    }
}
