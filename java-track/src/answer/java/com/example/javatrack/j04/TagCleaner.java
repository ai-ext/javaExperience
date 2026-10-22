package com.example.javatrack.j04;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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
        // LinkedHashSet은 중복을 버리면서 넣은 순서를 지킨다(HashSet은 순서를 지키지 않는다)
        Set<String> unique = new LinkedHashSet<>();
        for (String tag : tags) {
            if (tag == null || tag.isBlank()) {
                continue;
            }
            unique.add(tag.strip());
            if (unique.size() == MAX_TAGS) {
                break;
            }
        }
        return new ArrayList<>(unique);
    }
}
