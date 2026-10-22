package com.example.javatrack.j05;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 실무 습관: Map 실무 API(getOrDefault·computeIfAbsent·merge). */
public class TagIndex {

    private final Map<String, List<Long>> postIdsByTag = new HashMap<>();

    /** 태그에 글 id를 더한다. 처음 보는 태그면 리스트를 새로 만든다. */
    public void add(String tag, long postId) {
        // 키가 없을 때만 함수를 불러 새 리스트를 넣고, 있든 없든 그 키의 리스트를 돌려준다
        postIdsByTag.computeIfAbsent(tag, key -> new ArrayList<>()).add(postId);
    }

    /** 태그가 붙은 글 id 목록(넣은 순서). 없는 태그면 빈 리스트. */
    public List<Long> postIdsOf(String tag) {
        return postIdsByTag.getOrDefault(tag, List.of());
    }

    /** 글 목록에서 태그별로 몇 번 나왔는지 센다. */
    public static Map<String, Integer> countTags(List<Post> posts) {
        Map<String, Integer> counts = new HashMap<>();
        for (Post post : posts) {
            for (String tag : post.getTags()) {
                // 키가 없으면 1을 넣고, 있으면 (기존 값, 1)을 Integer::sum으로 합친다
                counts.merge(tag, 1, Integer::sum);
            }
        }
        return counts;
    }
}
