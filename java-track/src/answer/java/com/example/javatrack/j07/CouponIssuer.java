package com.example.javatrack.j07;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** 1인 1매 쿠폰 발급. 같은 회원이 동시에 여러 번 눌러도 한 장만 나가야 한다. */
public class CouponIssuer {

    // 여러 스레드가 함께 쓰는 Set. ConcurrentHashMap을 바탕으로 한 스레드 안전한 Set이다
    private final Set<Long> issuedMemberIds = ConcurrentHashMap.newKeySet();

    /** 처음 받는 회원이면 true, 이미 받았으면 false. "있나 확인하고 넣기"를 한 번에 한다. */
    public boolean issue(long memberId) {
        // contains로 확인한 뒤 add하면 두 요청이 둘 다 "없음"을 본다. add는 넣었으면 true, 이미 있었으면 false
        return issuedMemberIds.add(memberId);
    }

    public int issuedCount() {
        return issuedMemberIds.size();
    }
}
