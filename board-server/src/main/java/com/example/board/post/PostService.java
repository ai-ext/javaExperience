package com.example.board.post;

public interface PostService {

    /** 로그인 회원 명의로 글을 만들고 id를 돌려준다. */
    Long create(Long memberId, PostCreateRequest request);

    /** ACTIVE 글만 돌려준다. 없거나 삭제·숨김이면 404. */
    PostDetailResponse getDetail(Long postId);
}
