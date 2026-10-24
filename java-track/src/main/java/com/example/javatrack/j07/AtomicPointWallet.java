package com.example.javatrack.j07;

/**
 * AtomicInteger로 고친 지갑. 잠그지 않고, "읽은 값이 그대로일 때만 바꾸기"(compareAndSet)를 성공할 때까지 되풀이한다.
 * earn은 읽기({@code get}) → {@code betweenReadAndWrite.run()} → {@code compareAndSet(읽은 값, 읽은 값 + amount)}.
 * 실패하면(그 사이 다른 스레드가 바꿨으면) 처음부터 다시 읽는다.
 */
public class AtomicPointWallet {

    private final Runnable betweenReadAndWrite;
    // TODO: 잔액을 담을 AtomicInteger 필드를 선언하세요(0에서 시작)

    public AtomicPointWallet(Runnable betweenReadAndWrite) {
        throw new UnsupportedOperationException("J07: AtomicPointWallet 생성자 — 받은 틈을 필드에 담으세요");
    }

    /** get → betweenReadAndWrite.run() → compareAndSet. 실패하면 다시 get부터. */
    public void earn(int amount) {
        throw new UnsupportedOperationException("J07: AtomicPointWallet.earn — compareAndSet이 성공할 때까지 되풀이하세요");
    }

    public int balance() {
        throw new UnsupportedOperationException("J07: AtomicPointWallet.balance — AtomicInteger의 값을 돌려주세요");
    }
}
