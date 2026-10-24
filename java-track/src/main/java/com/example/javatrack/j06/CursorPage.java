package com.example.javatrack.j06;

import java.util.List;
import java.util.function.Function;

/**
 * 커서 방식 목록 한 쪽. 마지막 쪽이면 nextCursor가 null이다.
 * board-server의 {@code CursorPage<T>}와 같은 모양이다(거기서는 커서를 Base64 문자열로 감싼다).
 */
public record CursorPage<T>(List<T> items, Long nextCursor) {

    /**
     * 한 건 더 읽어 온 목록(fetched, 최대 size+1건)으로 한 쪽을 만든다.
     * fetched가 size보다 많으면 앞의 size건만 담고 마지막 항목의 id를 nextCursor로, 아니면 전부 담고 nextCursor는 null.
     * {@code T extends HasId}라서 어떤 행이든 id()를 부를 수 있다. 받은 목록은 T의 하위 타입 목록이어도 된다.
     */
    public static <T extends HasId> CursorPage<T> of(List<? extends T> fetched, int size) {
        throw new UnsupportedOperationException("J06: CursorPage.of — size+1건인지 보고 자른 뒤 마지막 id를 커서로 담으세요");
    }

    /** 항목만 mapper로 바꾼 새 쪽. 커서는 그대로 둔다(엔티티 쪽 → DTO 쪽). */
    public <R> CursorPage<R> map(Function<? super T, ? extends R> mapper) {
        throw new UnsupportedOperationException("J06: CursorPage.map — items를 mapper로 바꾸고 nextCursor는 그대로 담으세요");
    }

    public boolean hasNext() {
        return nextCursor != null;
    }
}
