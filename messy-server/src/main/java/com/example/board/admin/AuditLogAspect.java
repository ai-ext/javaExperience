package com.example.board.admin;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.example.board.common.BusinessException;
import com.example.board.member.AuthMember;

/**
 * @Audited 메서드가 끝나면 audit_log에 한 줄을 남긴다. 성공은 result=SUCCESS, 실패한 시도는 result=FAILURE와 오류 종류.
 * 기록은 AuditLogWriter가 별도 트랜잭션으로 쓰므로 업무가 롤백돼도 남는다.
 * 순서: 메서드 보안(@PreAuthorize, 200) → 이 aspect → 트랜잭션(LOWEST_PRECEDENCE).
 * 트랜잭션 바깥이라 proceed()가 돌아왔을 때 업무는 이미 커밋돼 있다(커밋 실패도 실패로 기록된다).
 * 권한 거부는 업무를 시도하기 전에 막힌 것이라 기록하지 않는다.
 */
@Aspect
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 1)
public class AuditLogAspect {

    private final AuditLogWriter writer;

    public AuditLogAspect(AuditLogWriter writer) {
        this.writer = writer;
    }

    @Around("@annotation(audited)")
    public Object record(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
        Long actorId = currentActorId();
        Long targetId = targetId(joinPoint.getArgs());
        Object result;
        try {
            result = joinPoint.proceed();
        } catch (Throwable e) {
            try {
                writer.write(actorId, audited.action(), audited.targetType(), targetId, failure(e));
            } catch (RuntimeException writeFailure) {
                // 기록 실패가 원래 예외를 가리지 않게 한다
                e.addSuppressed(writeFailure);
            }
            throw e;
        }
        writer.write(actorId, audited.action(), audited.targetType(), targetId, success(result));
        return result;
    }

    private static Long currentActorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthMember member) {
            return member.id();
        }
        // 메서드 보안을 통과했다면 항상 인증된 회원이 있다. 행위자 없는 감사 기록은 남기지 않는다.
        throw new IllegalStateException("감사 대상 동작에 인증된 회원이 없습니다.");
    }

    /** 대상 id는 첫 번째 인자(Long)다. */
    private static Long targetId(Object[] args) {
        return args.length > 0 && args[0] instanceof Long id ? id : null;
    }

    private static String success(Object result) {
        String extra = result instanceof AuditDetail d ? d.auditDetail() : null;
        return extra == null ? "result=SUCCESS" : "result=SUCCESS, " + extra;
    }

    private static String failure(Throwable e) {
        String error = e instanceof BusinessException be ? be.errorCode().name() : e.getClass().getSimpleName();
        return "result=FAILURE, error=" + error;
    }
}
