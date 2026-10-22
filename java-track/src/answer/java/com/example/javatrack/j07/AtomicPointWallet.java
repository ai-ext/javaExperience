package com.example.javatrack.j07;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * AtomicInteger로 고친 지갑. 잠그지 않고, "읽은 값이 그대로일 때만 바꾸기"(compareAndSet)를 성공할 때까지 되풀이한다.
 * earn은 읽기({@code get}) → {@code betweenReadAndWrite.run()} → {@code compareAndSet(읽은 값, 읽은 값 + amount)}.
 * 실패하면(그 사이 다른 스레드가 바꿨으면) 처음부터 다시 읽는다.
 */
public class AtomicPointWallet {

    private final Runnable betweenReadAndWrite;
    private final AtomicInteger balance = new AtomicInteger(0);

    public AtomicPointWallet(Runnable betweenReadAndWrite) {
        this.betweenReadAndWrite = betweenReadAndWrite;
    }

    /** get → betweenReadAndWrite.run() → compareAndSet. 실패하면 다시 get부터. */
    public void earn(int amount) {
        while (true) {
            int current = balance.get();
            betweenReadAndWrite.run();
            // 지금 값이 아직 current일 때만 바꾼다. 그 사이 누가 바꿨으면 false → 새 값을 다시 읽는다
            if (balance.compareAndSet(current, current + amount)) {
                return;
            }
        }
    }

    public int balance() {
        return balance.get();
    }
}
