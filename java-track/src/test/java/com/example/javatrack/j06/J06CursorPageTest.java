package com.example.javatrack.j06;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.LongStream;

import org.junit.jupiter.api.Test;

/** 주제 과제: 제네릭 메서드·와일드카드, Comparator 정렬 — CursorPage&lt;T&gt;와 커서 비교기. */
class J06CursorPageTest {

    private static List<PostRow> postsDesc(int count) {
        // id가 큰 것부터(최신순) count건
        return LongStream.rangeClosed(1, count)
                .map(i -> count + 1 - i)
                .mapToObj(id -> new PostRow(id, "글 " + id, 0))
                .toList();
    }

    @Test
    void 한_건_더_읽어_왔으면_size만큼_자르고_마지막_id를_다음_커서로_준다() {
        CursorPage<PostRow> page = CursorPage.of(postsDesc(21), 20);

        assertThat(page.items()).hasSize(20);
        assertThat(page.items().get(19).id()).isEqualTo(2L);
        assertThat(page.nextCursor()).isEqualTo(2L);
        assertThat(page.hasNext()).isTrue();
    }

    @Test
    void size_이하로_읽어_왔으면_마지막_쪽이라_다음_커서가_null이다() {
        CursorPage<PostRow> last = CursorPage.of(postsDesc(1), 20);
        CursorPage<PostRow> exact = CursorPage.of(postsDesc(20), 20);

        assertThat(last.items()).hasSize(1);
        assertThat(last.nextCursor()).isNull();
        assertThat(exact.items()).hasSize(20);
        assertThat(exact.hasNext()).isFalse();
    }

    @Test
    void map은_항목만_바꾸고_커서는_그대로_둔다() {
        CursorPage<PostRow> rows = CursorPage.of(postsDesc(3), 2);

        // R은 mapper가 돌려주는 타입(String)으로 정해진다
        CursorPage<String> titles = rows.map(PostRow::title);

        assertThat(titles.items()).containsExactly("글 3", "글 2");
        assertThat(titles.nextCursor()).isEqualTo(rows.nextCursor()).isEqualTo(2L);
    }

    @Test
    void T_extends_HasId라서_글이든_댓글이든_같은_메서드로_쪽을_만든다() {
        List<CommentRow> comments = List.of(
                new CommentRow(30, 1, "셋째"), new CommentRow(20, 1, "둘째"), new CommentRow(10, 1, "첫째"));

        CursorPage<CommentRow> page = CursorPage.of(comments, 2);
        // List<? extends HasId>: 하위 타입 목록(List<PostRow>)을 상위 타입 쪽(CursorPage<HasId>)으로 받을 수 있다
        CursorPage<HasId> anyRows = CursorPage.<HasId>of(postsDesc(3), 2);

        assertThat(page.items()).extracting(CommentRow::content).containsExactly("셋째", "둘째");
        assertThat(page.nextCursor()).isEqualTo(20L);
        assertThat(anyRows.nextCursor()).isEqualTo(2L);
    }

    @Test
    void 최신순은_id_내림차순이다() {
        List<PostRow> rows = new ArrayList<>(List.of(
                new PostRow(2, "둘째", 0), new PostRow(3, "셋째", 0), new PostRow(1, "첫째", 0)));

        rows.sort(CursorOrders.byIdDesc());

        assertThat(rows).extracting(PostRow::id).containsExactly(3L, 2L, 1L);
    }

    @Test
    void 인기순은_좋아요_내림차순이고_같으면_id_내림차순이다() {
        List<PostRow> rows = new ArrayList<>(List.of(
                new PostRow(1, "가", 5), new PostRow(2, "나", 9), new PostRow(3, "다", 5), new PostRow(4, "라", 0)));

        rows.sort(CursorOrders.popular());

        assertThat(rows).extracting(PostRow::id).containsExactly(2L, 3L, 1L, 4L);
    }

    @Test
    void 커서_다음부터_size건을_정렬_순서대로_돌려준다() {
        List<PostRow> rows = List.of(
                new PostRow(1, "가", 5), new PostRow(2, "나", 9), new PostRow(3, "다", 5), new PostRow(4, "라", 0));
        PostRow cursor = new PostRow(3, "다", 5); // 앞 쪽의 마지막 행

        List<PostRow> next = CursorOrders.pageAfter(rows, cursor, CursorOrders.popular(), 2);
        List<PostRow> first = CursorOrders.pageAfter(rows, null, CursorOrders.popular(), 2);

        assertThat(first).extracting(PostRow::id).containsExactly(2L, 3L);
        assertThat(next).extracting(PostRow::id).containsExactly(1L, 4L);
    }

    @Test
    void super_와일드카드_덕분에_HasId_비교기를_댓글_목록에도_쓴다() {
        List<CommentRow> comments = List.of(
                new CommentRow(10, 1, "첫째"), new CommentRow(30, 1, "셋째"), new CommentRow(20, 1, "둘째"));

        // Comparator<? super CommentRow> 자리에 Comparator<HasId>가 들어간다
        List<CommentRow> page = CursorOrders.pageAfter(comments, new CommentRow(30, 1, "셋째"), CursorOrders.byIdDesc(), 5);

        assertThat(page).extracting(CommentRow::id).containsExactly(20L, 10L);
    }

    @Test
    void 함정_long_id의_차이를_int로_자르는_비교기는_큰_id에서_순서가_뒤집힌다() {
        PostRow small = new PostRow(1, "옛 글", 0);
        PostRow huge = new PostRow(3_000_000_000L, "새 글", 0);

        // 3_000_000_000 - 1을 int로 자르면 음수가 되어 "새 글이 더 작다"고 답한다
        assertThat(LeakyComparators.BY_ID_DESC_SUBTRACT.compare(huge, small)).isPositive();
        assertThat(CursorOrders.byIdDesc().compare(huge, small)).isNegative();

        List<PostRow> rows = new ArrayList<>(List.of(small, huge));
        rows.sort(CursorOrders.byIdDesc());
        assertThat(rows).containsExactly(huge, small);
    }
}
