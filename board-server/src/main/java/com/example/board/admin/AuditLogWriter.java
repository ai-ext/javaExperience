package com.example.board.admin;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 감사 로그는 업무와 별도 트랜잭션(REQUIRES_NEW)으로 쓴다. 같은 트랜잭션이면 업무가 롤백될 때
 * "시도했다"는 기록까지 함께 사라진다. 부르는 쪽이 다른 빈이어야 프록시를 거쳐 새 트랜잭션이 열린다.
 */
@Component
public class AuditLogWriter {

    private final AuditLogRepository auditLogRepository;

    public AuditLogWriter(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void write(Long actorId, String action, String targetType, Long targetId, String detail) {
        auditLogRepository.save(AuditLog.create(actorId, action, targetType, targetId, detail));
    }
}
