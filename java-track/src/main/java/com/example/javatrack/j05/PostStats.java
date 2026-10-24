package com.example.javatrack.j05;

import java.util.List;
import java.util.Map;

/** 기본기 반복: 그룹별 합계. */
public final class PostStats {

    private PostStats() {
    }

    /** 작성자 닉네임별 좋아요 합계. stream의 groupingBy로 묶는다. */
    public static Map<String, Integer> likesByAuthor(List<Post> posts) {
        throw new UnsupportedOperationException("J05: PostStats.likesByAuthor — groupingBy(작성자, summingInt(좋아요))");
    }
}
