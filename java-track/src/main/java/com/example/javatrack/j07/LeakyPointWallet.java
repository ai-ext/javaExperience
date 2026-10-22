package com.example.javatrack.j07;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link SynchronizedPointWallet}·{@link AtomicPointWallet}과 비교하려고 둔다.
 * 잔액을 읽고(①) 더해서 쓴다(②). ①과 ② 사이에 다른 스레드가 같은 잔액을 읽으면 한쪽 적립이 사라진다.
 * DB로 치면 "SELECT로 잔액을 읽고 더해서 UPDATE"하는 코드다.
 * <p>
 * 생성자로 받은 {@code betweenReadAndWrite}는 ①과 ② 사이에 한 번 실행된다. 테스트가 이 틈을 일부러 벌려
 * 갱신 손실을 확실히 재현한다. 실무 코드라면 이 자리에 다른 계산·쿼리·네트워크 호출이 있다.
 */
public class LeakyPointWallet {

    private final Runnable betweenReadAndWrite;
    private int balance = 0;

    public LeakyPointWallet(Runnable betweenReadAndWrite) {
        this.betweenReadAndWrite = betweenReadAndWrite;
    }

    public void earn(int amount) {
        int current = balance;              // ① 읽기
        betweenReadAndWrite.run();          //    틈
        balance = current + amount;         // ② 쓰기
    }

    public int balance() {
        return balance;
    }
}
