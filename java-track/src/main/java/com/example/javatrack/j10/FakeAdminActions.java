package com.example.javatrack.j10;

import java.util.ArrayList;
import java.util.List;

/**
 * 주어진 구현: 고치지 않는다.
 * 실제로 무언가를 숨기지는 않고, 불린 메서드와 인자를 {@link #calls()}에 남긴다.
 * 어노테이션은 board-server의 {@code @Audited}처럼 구현 클래스 메서드에 붙였다(bulkIssueCoupon만 인터페이스 쪽).
 */
public class FakeAdminActions implements AdminActions {

    private final List<String> calls = new ArrayList<>();

    @Timed
    @Override
    public String hidePost(Long postId) {
        calls.add("hidePost:" + postId);
        if (postId <= 0) {
            throw new PostNotFoundException(postId);
        }
        return "HIDDEN:" + postId;
    }

    /** 어노테이션 없음. 안에서 this.hidePost를 부른다(같은 객체 안 호출). */
    @Override
    public List<String> hideAll(List<Long> postIds) {
        calls.add("hideAll:" + postIds);
        List<String> results = new ArrayList<>();
        for (Long postId : postIds) {
            results.add(this.hidePost(postId));
        }
        return results;
    }

    @Override
    public int countReports() {
        calls.add("countReports");
        return 3;
    }

    @Override
    public int bulkIssueCoupon(Long couponId, List<Long> memberIds) {
        calls.add("bulkIssueCoupon:" + couponId);
        return memberIds.size();
    }

    @ClassRetainedTimed
    @Override
    public void resolveReport(Long reportId) {
        calls.add("resolveReport:" + reportId);
    }

    public List<String> calls() {
        return List.copyOf(calls);
    }
}
