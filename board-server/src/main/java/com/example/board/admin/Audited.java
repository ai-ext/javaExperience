package com.example.board.admin;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 감사 로그를 남길 관리자 동작 표시. 대상 id는 메서드의 첫 번째 인자(Long)다.
 * 프록시가 가로채므로 public 메서드에 붙이고, 다른 빈에서 불러야 한다(같은 클래스 안 this 호출·private 메서드는 기록되지 않는다).
 */
@Documented
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {

    /** 예: HIDE_POST, BULK_ISSUE_COUPON */
    String action();

    /** 예: POST, COUPON */
    String targetType();
}
