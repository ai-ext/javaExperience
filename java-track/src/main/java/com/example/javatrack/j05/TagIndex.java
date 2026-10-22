package com.example.javatrack.j05;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 실무 습관: Map 실무 API(getOrDefault·computeIfAbsent·merge). */
public class TagIndex {

    private final Map<String, List<Long>> postIdsByTag = new HashMap<>();

    /** 태그에 글 id를 더한다. 처음 보는 태그면 리스트를 새로 만든다. */
    public void add(String tag, long postId) {
        throw new UnsupportedOperationException("J05: TagIndex.add — computeIfAbsent(tag, k -> new ArrayList<>()).add(...)");
    }

    /** 태그가 붙은 글 id 목록(넣은 순서)의 고칠 수 없는 복사본. 없는 태그면 빈 리스트. 돌려준 목록을 고쳐도 색인은 그대로다. */
    public List<Long> postIdsOf(String tag) {
        throw new UnsupportedOperationException("J05: TagIndex.postIdsOf — getOrDefault로 찾고(없으면 빈 리스트) List.copyOf로 복사해 돌려주세요");
    }

    /** 글 목록에서 태그별로 몇 번 나왔는지 센다. */
    public static Map<String, Integer> countTags(List<Post> posts) {
        throw new UnsupportedOperationException("J05: TagIndex.countTags — merge(tag, 1, Integer::sum)");
    }
}
