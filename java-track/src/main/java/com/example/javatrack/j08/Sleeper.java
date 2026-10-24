package com.example.javatrack.j08;

import java.time.Duration;

/**
 * 주어진 함수형 인터페이스: 고치지 않는다.
 * 재시도 사이에 기다리는 일을 밖에서 주입받는다. 실제 서버에서는 {@code d -> Thread.sleep(d.toMillis())}를 넘기고,
 * 테스트는 기다리지 않고 받은 시간만 기록하는 람다를 넘긴다.
 * {@link Thread#sleep}처럼 체크 예외 {@link InterruptedException}을 던질 수 있다.
 */
@FunctionalInterface
public interface Sleeper {

    void sleep(Duration duration) throws InterruptedException;
}
