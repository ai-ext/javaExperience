package com.example.javatrack.j00;

import java.util.ArrayList;
import java.util.List;

/** 반복문을 stream으로 옮기는 연습. */
public final class PostStreams {

    private PostStreams() {
    }

    /** 주어진 코드: for로 쓴 원본이다. 고치지 않는다. */
    public static List<String> popularTitlesWithFor(List<Post> posts, int minLikes) {
        List<String> result = new ArrayList<>();
        for (Post post : posts) {
            if (post.getLikeCount() >= minLikes) {
                result.add(post.getTitle());
            }
        }
        return result;
    }

    /** 위 for 반복문을 stream(filter → map → toList)으로 옮긴다. 결과는 원본과 같아야 한다. */
    public static List<String> popularTitles(List<Post> posts, int minLikes) {
        throw new UnsupportedOperationException("J00: PostStreams.popularTitles — popularTitlesWithFor를 stream으로 옮기세요");
    }
}
