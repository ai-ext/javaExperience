package com.example.javatrack.j06;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** 기본기 반복: 태그별 글 수를 세어 정렬. */
public final class TagRanking {

    private TagRanking() {
    }

    /** 글마다 붙은 태그 목록을 받아 태그별 글 수를 센다. 많은 순, 같은 수면 태그 이름 오름차순. */
    public static List<TagCount> rank(List<List<String>> tagsOfPosts) {
        Map<String, Long> counts = tagsOfPosts.stream()
                .flatMap(List::stream)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        return counts.entrySet().stream()
                .map(entry -> new TagCount(entry.getKey(), entry.getValue()))
                // 첫 기준을 뒤집은 뒤 thenComparing을 붙인다. 순서를 바꾸면 이름까지 뒤집힌다
                .sorted(Comparator.comparingLong(TagCount::count).reversed()
                        .thenComparing(TagCount::tag))
                .toList();
    }
}
