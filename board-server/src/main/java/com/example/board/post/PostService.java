package com.example.board.post;

public interface PostService {

    /** 로그인 회원 명의로 글을 만들고 id를 돌려준다. */
    Long create(Long memberId, PostCreateRequest request);
}
