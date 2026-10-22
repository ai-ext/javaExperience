package com.example.javatrack.j10;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.time.Duration;

/**
 * {@link Timed}가 붙은 메서드만 실행 시간을 기록하는 JDK 동적 프록시(AOP의 원리).
 * <ul>
 *   <li>{@code Proxy.newProxyInstance}로 type 인터페이스를 구현한 프록시를 만들고, 모든 호출을 target에 넘긴다</li>
 *   <li>{@link Timed}는 인터페이스 메서드와 target 클래스의 같은 메서드 중 어느 쪽에 붙어 있어도 찾는다</li>
 *   <li>기록은 {@code new Timing(메서드 이름, 걸린 시간)}. 대상이 예외를 던져도 기록한다</li>
 *   <li>대상이 던진 예외는 포장하지 않고 그대로 던진다(리플렉션이 감싼 InvocationTargetException을 벗긴다)</li>
 *   <li>{@code equals}·{@code hashCode}·{@code toString}도 프록시로 들어온다(Method의 선언 클래스가 Object).
 *       target에 넘기지 않고 프록시 자신을 기준으로 답한다: equals는 같은 프록시일 때만 true,
 *       hashCode는 {@code System.identityHashCode(프록시)}. 기록하지 않는다</li>
 * </ul>
 */
public final class TimedProxy {

    private TimedProxy() {
    }

    /** target을 감싼 프록시를 type으로 돌려준다. type은 인터페이스여야 한다. */
    public static <T> T wrap(Class<T> type, T target, TimingLog log) {
        Object proxy = Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, (self, method, args) -> {
            if (method.getDeclaringClass() == Object.class) {
                // equals·hashCode·toString. target에 넘기면 proxy.equals(proxy)가 target.equals(proxy) = false가 된다
                return objectMethod(self, target, method, args);
            }
            if (!isTimed(method, target.getClass())) {
                return invoke(target, method, args);
            }
            long start = System.nanoTime();
            try {
                return invoke(target, method, args);
            } finally {
                // 성공이든 예외든 한 줄 남긴다
                log.add(new Timing(method.getName(), Duration.ofNanos(System.nanoTime() - start)));
            }
        });
        return type.cast(proxy);
    }

    /**
     * 프록시가 받은 인터페이스 메서드 기준으로 {@link Timed}가 붙어 있는지 본다.
     * 인터페이스 메서드에 없으면 targetClass에서 이름·매개변수 타입이 같은 메서드를 찾아 본다.
     */
    public static boolean isTimed(Method interfaceMethod, Class<?> targetClass) {
        if (interfaceMethod.isAnnotationPresent(Timed.class)) {
            return true;
        }
        try {
            // 프록시가 받는 Method는 인터페이스 쪽이다. 구현 클래스에 붙은 어노테이션은 구현 메서드를 찾아야 보인다
            Method implementation = targetClass.getMethod(interfaceMethod.getName(), interfaceMethod.getParameterTypes());
            return implementation.isAnnotationPresent(Timed.class);
        } catch (NoSuchMethodException e) {
            return false;
        }
    }

    /** 프록시 자신의 참조로 답한다. 같은 프록시끼리만 같고, hashCode는 그와 맞는 identityHashCode다. */
    private static Object objectMethod(Object self, Object target, Method method, Object[] args) {
        return switch (method.getName()) {
            case "equals" -> self == args[0];
            case "hashCode" -> System.identityHashCode(self);
            case "toString" -> "TimedProxy(" + target + ")";
            default -> throw new IllegalStateException("프록시로 들어올 수 없는 Object 메서드: " + method);
        };
    }

    private static Object invoke(Object target, Method method, Object[] args) throws Throwable {
        try {
            return method.invoke(target, args);
        } catch (InvocationTargetException e) {
            // 대상이 던진 원래 예외를 꺼내 던진다. 그대로 두면 호출한 쪽은 UndeclaredThrowableException을 받는다
            throw e.getCause();
        }
    }
}
