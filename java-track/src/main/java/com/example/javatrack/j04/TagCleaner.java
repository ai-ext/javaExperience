package com.example.javatrack.j04;

import java.util.List;

/** 기본기 반복: 글 작성 요청의 태그 목록 정리. */
public final class TagCleaner {

    public static final int MAX_TAGS = 5;

    private TagCleaner() {
    }

    /**
     * 태그마다 앞뒤 공백을 지우고, null·빈 문자열·공백뿐인 태그는 버린다.
     * 같은 태그는 처음 나온 것 하나만 남기고(순서 유지), 앞에서부터 최대 {@value #MAX_TAGS}개만 돌려준다.
     */
    public static List<String> clean(List<String> tags) {
        throw new UnsupportedOperationException("J04: TagCleaner.clean — strip·빈 값 제거·중복 제거(순서 유지)·최대 5개");
    }
}
