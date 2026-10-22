package com.example.javatrack.j02;

import java.util.ArrayList;
import java.util.List;

/** 기본기 반복: 좋아요 합계(for와 stream), 태그 문자열 나누기. */
public final class PostBasics {

    private PostBasics() {
    }

    /** 향상된 for로 좋아요 수를 모두 더한다. */
    public static int sumLikesWithFor(List<PostRow> rows) {
        int sum = 0;
        for (PostRow row : rows) {
            sum += row.likeCount();
        }
        return sum;
    }

    /** 같은 합계를 stream으로 구한다. */
    public static int sumLikesWithStream(List<PostRow> rows) {
        // Stream<PostRow> → IntStream으로 바꿔야 sum()이 있다
        return rows.stream().mapToInt(PostRow::likeCount).sum();
    }

    /**
     * 쉼표로 이어진 태그 문자열을 나눈다. 조각마다 앞뒤 공백(전각 공백 포함)을 지우고, 빈 조각은 버린다.
     * null이거나 공백뿐인 문자열이면 빈 리스트를 돌려준다.
     */
    public static List<String> splitTags(String raw) {
        List<String> tags = new ArrayList<>();
        if (raw == null) {
            return tags;
        }
        for (String piece : raw.split(",")) {
            // trim()은 ' ' 이하 문자만 지운다. strip()은 전각 공백(　) 같은 유니코드 공백도 지운다
            String tag = piece.strip();
            if (!tag.isEmpty()) {
                tags.add(tag);
            }
        }
        return tags;
    }
}
