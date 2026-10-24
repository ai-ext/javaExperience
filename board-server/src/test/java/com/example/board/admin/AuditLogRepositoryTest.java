package com.example.board.admin;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.Repository;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;

class AuditLogRepositoryTest extends ApiTestSupport {

    @Autowired
    AuditLogRepository auditLogRepository;

    @Autowired
    AuditLogWriter auditLogWriter;

    @Autowired
    TransactionTemplate tx;

    int logs(String action, Long targetId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM audit_log WHERE action = ? AND target_id = ?", Integer.class,
                action, targetId);
    }

    // 추가 전용: JpaRepository를 확장하면 delete·saveAll 등이 저절로 생긴다
    @Test
    void 저장소는_저장과_커서_조회만_있고_수정_삭제_메서드가_없다() {
        assertThat(Repository.class).isAssignableFrom(AuditLogRepository.class);
        assertThat(CrudRepository.class.isAssignableFrom(AuditLogRepository.class)).isFalse();

        List<String> names = Arrays.stream(AuditLogRepository.class.getMethods()).map(Method::getName).toList();

        assertThat(names).containsExactlyInAnyOrder("save", "findPage");
        assertThat(names).noneMatch(n -> n.startsWith("delete") || n.startsWith("update") || n.startsWith("saveAll"));
    }

    @Test
    void 저장하면_감사_필드가_채워지고_id_내림차순_커서로_읽는다() {
        AuditLog first = auditLogRepository.save(AuditLog.create(1L, "TEST_ACTION", "POST", 10L, "첫째"));
        AuditLog second = auditLogRepository.save(AuditLog.create(1L, "TEST_ACTION", "POST", 11L, "둘째"));
        AuditLog third = auditLogRepository.save(AuditLog.create(1L, "TEST_ACTION", "POST", 12L, null));

        // 다른 테스트가 남긴 행에 흔들리지 않게 방금 넣은 범위에서 읽는다
        List<AuditLog> page = auditLogRepository.findPage(third.getId() + 1, PageRequest.of(0, 2));
        List<AuditLog> next = auditLogRepository.findPage(second.getId(), PageRequest.of(0, 1));

        assertThat(page).extracting(AuditLog::getId).containsExactly(third.getId(), second.getId());
        assertThat(next).extracting(AuditLog::getId).containsExactly(first.getId());
        assertThat(page.get(0).getCreatedAt()).isNotNull();
        assertThat(page.get(0).getUpdatedAt()).isNotNull();
        assertThat(page.get(1)).extracting(AuditLog::getActorId, AuditLog::getAction, AuditLog::getTargetType,
                AuditLog::getTargetId, AuditLog::getDetail).containsExactly(1L, "TEST_ACTION", "POST", 11L, "둘째");
    }

    @Test
    void 첫_쪽은_가장_최근_기록부터() {
        AuditLog latest = auditLogRepository.save(AuditLog.create(1L, "TEST_ACTION", "POST", 13L, null));

        assertThat(auditLogRepository.findPage(null, PageRequest.of(0, 1))).extracting(AuditLog::getId)
                .containsExactly(latest.getId());
    }

    // 함정: 감사 로그를 업무와 같은 트랜잭션에 쓰면 업무가 롤백될 때 "시도했다"는 기록까지 함께 사라진다
    @Test
    void 업무_트랜잭션이_롤백돼도_감사_로그는_남는다() {
        Member author = newMember(Role.USER);
        Long targetId = System.nanoTime();

        tx.executeWithoutResult(s -> {
            jdbc.update("INSERT INTO post (member_id, title, content, status, like_count, created_at, updated_at)"
                    + " VALUES (?, '롤백될 글', '내용', 'ACTIVE', 0, NOW(6), NOW(6))", author.getId());
            auditLogWriter.write(author.getId(), "TEST_ROLLBACK", "POST", targetId, "업무는 롤백된다");
            s.setRollbackOnly();
        });

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM post WHERE member_id = ?", Integer.class, author.getId()))
                .as("업무 행").isZero();
        assertThat(logs("TEST_ROLLBACK", targetId)).as("감사 로그").isEqualTo(1);
    }
}
