package com.example.javatrack.j04;

/** 타입 한 컷: 글 작성자 id와 요청한 회원 id 비교. */
public final class AuthorCheck {

    private AuthorCheck() {
    }

    /** 두 id가 같은 값이면 true. writerId나 memberId가 null이면 false. */
    public static boolean isWrittenBy(Long writerId, Long memberId) {
        // equals는 값을 비교한다. equals(null)은 false라 memberId가 null이어도 안전하다
        return writerId != null && writerId.equals(memberId);
    }
}
