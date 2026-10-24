package com.example.javatrack.j07;

/**
 * synchronized로 고친 지갑. 한 번에 한 스레드만 earn 안에 들어온다.
 * earn은 {@link LeakyPointWallet}처럼 읽기 → {@code betweenReadAndWrite.run()} → 쓰기 순서를 지킨다(테스트가 틈을 벌린다).
 */
public class SynchronizedPointWallet {

    private final Runnable betweenReadAndWrite;
    private int balance = 0;

    public SynchronizedPointWallet(Runnable betweenReadAndWrite) {
        this.betweenReadAndWrite = betweenReadAndWrite;
    }

    /** 읽기 → betweenReadAndWrite.run() → 쓰기. 다른 스레드가 사이에 끼지 못하게 한다. */
    public synchronized void earn(int amount) {
        // 이 객체의 잠금을 쥔 스레드 하나만 들어온다. 다른 스레드는 잠금이 풀릴 때까지 메서드 입구에서 기다린다
        int current = balance;
        betweenReadAndWrite.run();
        balance = current + amount;
    }

    /** 잔액을 읽을 때도 같은 잠금을 쓴다(다른 스레드가 쓴 값이 보이게). */
    public synchronized int balance() {
        return balance;
    }
}
