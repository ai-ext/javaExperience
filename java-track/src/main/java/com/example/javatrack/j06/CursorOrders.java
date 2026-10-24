package com.example.javatrack.j06;

import java.util.Comparator;
import java.util.List;

/** 커서 목록의 정렬 기준과 "커서 다음 쪽" 고르기. */
public final class CursorOrders {

    private CursorOrders() {
    }

    /** 최신순: id 내림차순. HasId면 무엇이든(글·댓글) 비교한다. */
    public static Comparator<HasId> byIdDesc() {
        throw new UnsupportedOperationException("J06: CursorOrders.byIdDesc — comparingLong(HasId::id)을 뒤집으세요");
    }

    /** 인기순: 좋아요 내림차순, 좋아요가 같으면 id 내림차순(커서가 한 줄로 정해지게). */
    public static Comparator<PostRow> popular() {
        throw new UnsupportedOperationException("J06: CursorOrders.popular — 좋아요 내림차순 thenComparing(byIdDesc())");
    }

    /**
     * rows를 order로 정렬했을 때 cursor 바로 다음부터 최대 size건. cursor가 null이면 처음부터.
     * cursor 자신은 담지 않는다. order는 T나 T의 상위 타입을 비교하는 비교기면 된다.
     */
    public static <T> List<T> pageAfter(List<T> rows, T cursor, Comparator<? super T> order, int size) {
        throw new UnsupportedOperationException("J06: CursorOrders.pageAfter — 정렬 → cursor보다 뒤인 것만 → size건");
    }
}
