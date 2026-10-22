package com.example.javatrack.j06;

import java.util.List;

/** 기본기 반복: 태그별 글 수를 세어 정렬. */
public final class TagRanking {

    private TagRanking() {
    }

    /** 글마다 붙은 태그 목록을 받아 태그별 글 수를 센다. 많은 순, 같은 수면 태그 이름 오름차순. */
    public static List<TagCount> rank(List<List<String>> tagsOfPosts) {
        throw new UnsupportedOperationException("J06: TagRanking.rank — 세고 나서 count 내림차순 thenComparing(tag)");
    }
}
