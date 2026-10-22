package com.example.javatrack.j00;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** 주제 과제: 필드 선언·초기화, 컬렉션에 담고 꺼내기, 일반 for와 향상된 for. */
class J00PostBoardTest {

    @Test
    void 새로_만든_게시판은_비어_있다() {
        PostBoard board = new PostBoard();

        assertThat(board.size()).isZero();
        assertThat(board.totalLikes()).isZero();
        assertThat(board.titles()).isEmpty();
    }

    @Test
    void 담은_순서대로_꺼낼_수_있다() {
        PostBoard board = new PostBoard();
        Post first = new Post("첫 글", 1);
        Post second = new Post("둘째 글", 2);

        board.add(first);
        board.add(second);

        assertThat(board.size()).isEqualTo(2);
        assertThat(board.get(0)).isSameAs(first);
        assertThat(board.get(1)).isSameAs(second);
    }

    @Test
    void 게시판마다_자기_글_목록을_따로_가진다() {
        PostBoard notice = new PostBoard();
        PostBoard free = new PostBoard();

        notice.add(new Post("공지", 0));

        assertThat(notice.size()).isEqualTo(1);
        assertThat(free.size()).isZero();
    }

    @Test
    void 좋아요_합계는_담긴_글의_좋아요를_모두_더한_값이다() {
        PostBoard board = new PostBoard();
        board.add(new Post("가", 3));
        board.add(new Post("나", 5));
        board.add(new Post("다", 0));

        assertThat(board.totalLikes()).isEqualTo(8);
    }

    @Test
    void 제목_목록은_담은_순서를_지킨다() {
        PostBoard board = new PostBoard();
        board.add(new Post("셋째로 쓴 글", 0));
        board.add(new Post("첫째로 쓴 글", 0));

        assertThat(board.titles()).containsExactly("셋째로 쓴 글", "첫째로 쓴 글");
    }
}
