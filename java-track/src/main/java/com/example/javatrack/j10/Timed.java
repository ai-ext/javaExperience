package com.example.javatrack.j10;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 주어진 어노테이션: 고치지 않는다.
 * 실행 시간을 기록할 메서드 표시. 실행 중에 리플렉션으로 읽어야 하므로 RUNTIME까지 남긴다.
 * 인터페이스 메서드나 구현 클래스의 메서드 어느 쪽에 붙여도 된다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Timed {
}
