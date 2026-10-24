package com.example.javatrack.j06;

import java.util.Comparator;
import java.util.List;

/** 커서 목록의 정렬 기준과 "커서 다음 쪽" 고르기. */
public final class CursorOrders {

    private CursorOrders() {
    }

    /** 최신순: id 내림차순. HasId면 무엇이든(글·댓글) 비교한다. */
    public static Comparator<HasId> byIdDesc() {
        // 빼기로 비교하지 않는다. comparingLong은 Long.compare를 써서 넘치지 않는다
        return Comparator.comparingLong(HasId::id).reversed();
    }

    /** 인기순: 좋아요 내림차순, 좋아요가 같으면 id 내림차순(커서가 한 줄로 정해지게). */
    public static Comparator<PostRow> popular() {
        // thenComparing은 Comparator<? super PostRow>를 받으므로 Comparator<HasId>를 그대로 넘길 수 있다
        return Comparator.comparingInt(PostRow::likeCount).reversed()
                .thenComparing(byIdDesc());
    }

    /**
     * rows를 order로 정렬했을 때 cursor 바로 다음부터 최대 size건. cursor가 null이면 처음부터.
     * cursor 자신은 담지 않는다. order는 T나 T의 상위 타입을 비교하는 비교기면 된다.
     */
    public static <T> List<T> pageAfter(List<T> rows, T cursor, Comparator<? super T> order, int size) {
        return rows.stream()
                .sorted(order)
                // 정렬 기준에서 cursor보다 뒤(compare > 0)인 것만 남긴다. 같은 행(compare == 0)은 빠진다
                .filter(row -> cursor == null || order.compare(row, cursor) > 0)
                .limit(size)
                .toList();
    }
}
