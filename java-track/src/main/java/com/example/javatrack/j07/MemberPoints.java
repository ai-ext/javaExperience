package com.example.javatrack.j07;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** 회원별 포인트 잔액. 여러 스레드가 동시에 적립한다. */
public class MemberPoints {

    private final Map<Long, Long> balances = new ConcurrentHashMap<>();

    /** 회원의 잔액에 amount를 더한다. 처음 적립하는 회원이면 amount로 시작한다. 동시에 불려도 손실이 없어야 한다. */
    public void earn(long memberId, long amount) {
        throw new UnsupportedOperationException("J07: MemberPoints.earn — get 후 put이 아니라 merge 한 번으로 더하세요");
    }

    /** 적립한 적이 없으면 0. */
    public long balanceOf(long memberId) {
        throw new UnsupportedOperationException("J07: MemberPoints.balanceOf — getOrDefault로 0을 돌려주세요");
    }
}
