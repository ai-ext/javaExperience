package com.example.board.post;

public interface PostService {

    /** 로그인 회원 명의로 글을 만들고 id를 돌려준다. */
    Long create(Long memberId, PostCreateRequest request);

    /** ACTIVE 글만 돌려준다. 없거나 삭제·숨김이면 404. */
    PostDetailResponse getDetail(Long postId);

    /** 작성자만 가능. 대상 없음(404)을 작성자 아님(403)보다 먼저 검사한다. */
    PostDetailResponse update(Long postId, Long memberId, PostUpdateRequest request);

    PostDetailResponse patch(Long postId, Long memberId, PostPatchRequest request);

    /** 소프트 삭제(status=DELETED). */
    void delete(Long postId, Long memberId);
}
