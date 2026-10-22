package com.example.javatrack.j10;

import java.util.List;

/**
 * 주어진 인터페이스: 고치지 않는다.
 * 관리자 동작. JDK 동적 프록시는 인터페이스를 구현한 가짜 객체를 만들므로 인터페이스가 있어야 한다.
 */
public interface AdminActions {

    /** 글 하나를 숨긴다. 없는 글(0 이하 id)이면 {@link PostNotFoundException}. */
    String hidePost(Long postId);

    /** 여러 글을 숨긴다. 구현은 같은 객체의 hidePost를 this로 부른다. */
    List<String> hideAll(List<Long> postIds);

    /** 처리할 신고 수. */
    int countReports();

    /** 쿠폰을 여러 회원에게 지급하고 지급한 수를 돌려준다. 이 메서드는 인터페이스 쪽에 {@link Timed}를 붙였다. */
    @Timed
    int bulkIssueCoupon(Long couponId, List<Long> memberIds);

    /** 신고를 처리 완료로 바꾼다. */
    void resolveReport(Long reportId);
}
