package com.example.javatrack.j02;

import java.util.List;

/** 기본기 반복: 좋아요 합계(for와 stream), 태그 문자열 나누기. */
public final class PostBasics {

    private PostBasics() {
    }

    /** 향상된 for로 좋아요 수를 모두 더한다. */
    public static int sumLikesWithFor(List<PostRow> rows) {
        throw new UnsupportedOperationException("J02: PostBasics.sumLikesWithFor — for로 돌며 likeCount를 더하세요");
    }

    /** 같은 합계를 stream으로 구한다. */
    public static int sumLikesWithStream(List<PostRow> rows) {
        throw new UnsupportedOperationException("J02: PostBasics.sumLikesWithStream — mapToInt와 sum으로 더하세요");
    }

    /**
     * 쉼표로 이어진 태그 문자열을 나눈다. 조각마다 앞뒤 공백(전각 공백 포함)을 지우고, 빈 조각은 버린다.
     * null이거나 공백뿐인 문자열이면 빈 리스트를 돌려준다.
     */
    public static List<String> splitTags(String raw) {
        throw new UnsupportedOperationException("J02: PostBasics.splitTags — split(\",\")으로 나누고 strip한 뒤 빈 조각을 버리세요");
    }
}
