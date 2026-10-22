package com.example.javatrack.j07;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** 회원별 포인트 잔액. 여러 스레드가 동시에 적립한다. */
public class MemberPoints {

    private final Map<Long, Long> balances = new ConcurrentHashMap<>();

    /** 회원의 잔액에 amount를 더한다. 처음 적립하는 회원이면 amount로 시작한다. 동시에 불려도 손실이 없어야 한다. */
    public void earn(long memberId, long amount) {
        // ConcurrentHashMap.merge는 "읽고 합쳐서 쓰기"를 그 키에 대해 한 번에(원자적으로) 한다.
        // get으로 읽고 put으로 쓰면 그 사이에 다른 스레드가 끼어 LeakyPointWallet과 같은 손실이 난다
        balances.merge(memberId, amount, Long::sum);
    }

    /** 적립한 적이 없으면 0. */
    public long balanceOf(long memberId) {
        return balances.getOrDefault(memberId, 0L);
    }
}
