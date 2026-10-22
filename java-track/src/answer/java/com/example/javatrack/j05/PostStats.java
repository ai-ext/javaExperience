package com.example.javatrack.j05;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** 기본기 반복: 그룹별 합계. */
public final class PostStats {

    private PostStats() {
    }

    /** 작성자 닉네임별 좋아요 합계. stream의 groupingBy로 묶는다. */
    public static Map<String, Integer> likesByAuthor(List<Post> posts) {
        // groupingBy(키를 고르는 함수, 같은 키끼리 모으는 방법)
        return posts.stream()
                .collect(Collectors.groupingBy(Post::getAuthorNickname, Collectors.summingInt(Post::getLikeCount)));
    }
}
