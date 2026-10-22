package com.example.javatrack.j10;

import java.lang.reflect.Method;

/**
 * {@link Timed}가 붙은 메서드만 실행 시간을 기록하는 JDK 동적 프록시(AOP의 원리).
 * <ul>
 *   <li>{@code Proxy.newProxyInstance}로 type 인터페이스를 구현한 프록시를 만들고, 모든 호출을 target에 넘긴다</li>
 *   <li>{@link Timed}는 인터페이스 메서드와 target 클래스의 같은 메서드 중 어느 쪽에 붙어 있어도 찾는다</li>
 *   <li>기록은 {@code new Timing(메서드 이름, 걸린 시간)}. 대상이 예외를 던져도 기록한다</li>
 *   <li>대상이 던진 예외는 포장하지 않고 그대로 던진다(리플렉션이 감싼 InvocationTargetException을 벗긴다)</li>
 * </ul>
 */
public final class TimedProxy {

    private TimedProxy() {
    }

    /** target을 감싼 프록시를 type으로 돌려준다. type은 인터페이스여야 한다. */
    public static <T> T wrap(Class<T> type, T target, TimingLog log) {
        throw new UnsupportedOperationException("J10: TimedProxy.wrap — Proxy.newProxyInstance와 InvocationHandler로 감싸세요");
    }

    /**
     * 프록시가 받은 인터페이스 메서드 기준으로 {@link Timed}가 붙어 있는지 본다.
     * 인터페이스 메서드에 없으면 targetClass에서 이름·매개변수 타입이 같은 메서드를 찾아 본다.
     */
    public static boolean isTimed(Method interfaceMethod, Class<?> targetClass) {
        throw new UnsupportedOperationException("J10: TimedProxy.isTimed — 인터페이스 메서드와 구현 메서드에서 @Timed를 찾으세요");
    }
}
