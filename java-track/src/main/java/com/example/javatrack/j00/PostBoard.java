package com.example.javatrack.j00;

import java.util.List;

/** 글을 담아 두는 게시판. 글 목록 필드는 직접 선언하고 초기화한다. */
public class PostBoard {

    // TODO: 글을 담을 List<Post> 필드를 선언하고 빈 ArrayList로 초기화하세요(게시판마다 따로 가져야 한다)

    public void add(Post post) {
        throw new UnsupportedOperationException("J00: PostBoard.add — 글 목록 필드에 담으세요");
    }

    public Post get(int index) {
        throw new UnsupportedOperationException("J00: PostBoard.get — index 번째 글을 꺼내세요");
    }

    public int size() {
        throw new UnsupportedOperationException("J00: PostBoard.size — 담긴 글 수를 돌려주세요");
    }

    /** 일반 for(인덱스 i)로 좋아요 수를 모두 더한다. */
    public int totalLikes() {
        throw new UnsupportedOperationException("J00: PostBoard.totalLikes — for (int i = 0; …)로 좋아요 합계를 구하세요");
    }

    /** 향상된 for로 제목을 담은 순서대로 모은다. */
    public List<String> titles() {
        throw new UnsupportedOperationException("J00: PostBoard.titles — for (Post post : …)로 제목 목록을 만드세요");
    }
}
