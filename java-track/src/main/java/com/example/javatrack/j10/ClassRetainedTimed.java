package com.example.javatrack.j10;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 주어진 함정 어노테이션: 고치지 않는다.
 * {@link Timed}와 같아 보이지만 리텐션이 CLASS다. 클래스 파일에는 남지만 실행 중 리플렉션으로는 보이지 않는다
 * (리텐션을 적지 않으면 기본값도 CLASS다).
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.CLASS)
public @interface ClassRetainedTimed {
}
