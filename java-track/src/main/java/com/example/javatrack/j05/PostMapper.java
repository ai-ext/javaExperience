package com.example.javatrack.j05;

import java.util.List;

/** 엔티티 목록 → 응답 목록. 삭제된(DELETED) 글은 뺀다. 같은 일을 for와 stream 두 가지로 한다. */
public final class PostMapper {

    private PostMapper() {
    }

    /** new ArrayList로 빈 리스트를 만들고 for로 돌며 ACTIVE 글만 PostResponse로 바꿔 담는다. */
    public static List<PostResponse> toResponsesWithFor(List<Post> posts) {
        throw new UnsupportedOperationException("J05: PostMapper.toResponsesWithFor — new ArrayList + for + if + add");
    }

    /** 같은 일을 stream의 filter·map·toList로 한다. */
    public static List<PostResponse> toResponsesWithStream(List<Post> posts) {
        throw new UnsupportedOperationException("J05: PostMapper.toResponsesWithStream — filter → map(PostResponse::from) → toList");
    }
}
