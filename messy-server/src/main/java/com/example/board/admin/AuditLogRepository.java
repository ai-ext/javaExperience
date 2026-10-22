package com.example.board.admin;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/** 추가 전용. JpaRepository를 확장하면 delete·saveAll 같은 메서드가 저절로 열리므로 필요한 것만 선언한다. */
public interface AuditLogRepository extends Repository<AuditLog, Long> {

    AuditLog save(AuditLog auditLog);

    /** id 내림차순 커서 조회. afterId가 null이면 가장 최근부터. */
    @Query("select a from AuditLog a where (:afterId is null or a.id < :afterId) order by a.id desc")
    List<AuditLog> findPage(@Param("afterId") Long afterId, Pageable pageable);
}
