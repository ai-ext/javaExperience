package com.example.javatrack.j02;

import java.util.HashMap;
import java.util.Map;

/** 메모리 저장소. Spring Data JPA의 save처럼 새 엔티티면 추가하고, 이미 저장된 엔티티면 덮어쓴다. */
public class PostRepository {

    private final Map<Long, Post> store = new HashMap<>();
    private long sequence = 0;

    /**
     * 새 글({@link BaseEntity#isNew()})이면 sequence를 1 올려 id로 매기고 추가한다.
     * 이미 id가 있으면 그 id 자리를 덮어쓴다(개수가 늘지 않는다). 받은 글을 그대로 돌려준다.
     */
    public Post save(Post post) {
        if (post.isNew()) {
            post.assignId(++sequence);
        }
        // 새 글이면 새 칸에, 저장된 글이면 같은 id 칸에 들어간다
        store.put(post.getId(), post);
        return post;
    }

    /** 없으면 NotFoundException. */
    public Post findById(long id) {
        Post post = store.get(id);
        if (post == null) {
            throw new NotFoundException("글", id);
        }
        return post;
    }

    public int count() {
        return store.size();
    }
}
