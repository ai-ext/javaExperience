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
    public void earn(int amount) {
        throw new UnsupportedOperationException("J07: SynchronizedPointWallet.earn — synchronized를 붙이고 읽기 → 틈 → 쓰기");
    }

    /** 잔액을 읽을 때도 같은 잠금을 쓴다(다른 스레드가 쓴 값이 보이게). */
    public int balance() {
        throw new UnsupportedOperationException("J07: SynchronizedPointWallet.balance — synchronized로 잔액을 돌려주세요");
    }
}
