package com.example.board.admin;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.method.AuthorizationInterceptorsOrder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.interceptor.BeanFactoryTransactionAttributeSourceAdvisor;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.ApiTestSupport;
import com.example.board.common.BusinessException;
import com.example.board.member.AuthMember;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuditLogAspectTest extends ApiTestSupport {

    @Autowired
    AdminService adminService;

    @Autowired
    TransactionTemplate tx;

    @Autowired
    BeanFactoryTransactionAttributeSourceAdvisor transactionAdvisor;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    List<String> details(String action, Long targetId) {
        return jdbc.queryForList("SELECT detail FROM audit_log WHERE action = ? AND target_id = ? ORDER BY id",
                String.class, action, targetId);
    }

    Long actorOf(String action, Long targetId) {
        return jdbc.queryForObject("SELECT actor_id FROM audit_log WHERE action = ? AND target_id = ?", Long.class,
                action, targetId);
    }

    void authenticate(Member member) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new AuthMember(member.getId(), member.getRole()), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + member.getRole().name()))));
    }

    @Test
    void 성공하면_행위자와_대상을_남긴다() {
        Member admin = newMember(Role.ADMIN);
        Long postId = newPost(newMember(Role.USER));
        authenticate(admin);

        adminService.hidePost(postId, null);

        assertThat(details("HIDE_POST", postId)).containsExactly("result=SUCCESS");
        assertThat(actorOf("HIDE_POST", postId)).isEqualTo(admin.getId());
    }

    @Test
    void 연결한_신고_id도_detail에_남긴다() {
        Long postId = newPost(newMember(Role.USER));
        jdbc.update("INSERT INTO report (post_id, reporter_id, reason, status, created_at, updated_at)"
                + " VALUES (?, ?, 'SPAM', 'OPEN', NOW(6), NOW(6))", postId, newMember(Role.USER).getId());
        Long reportId = jdbc.queryForObject("SELECT MAX(id) FROM report WHERE post_id = ?", Long.class, postId);
        authenticate(newMember(Role.ADMIN));

        adminService.hidePost(postId, reportId);

        assertThat(details("HIDE_POST", postId)).containsExactly("result=SUCCESS, reportId=" + reportId);
    }

    // Ruling: 실패한 시도도 같은 action으로 남기고 detail로 구분한다
    @Test
    void 실패한_시도도_기록하고_예외는_그대로_던진다() {
        Long missing = jdbc.queryForObject("SELECT COALESCE(MAX(id), 0) + 1000000 FROM post", Long.class);
        authenticate(newMember(Role.ADMIN));

        assertThatThrownBy(() -> adminService.hidePost(missing, null)).isInstanceOf(BusinessException.class);

        assertThat(details("HIDE_POST", missing)).containsExactly("result=FAILURE, error=NOT_FOUND");
    }

    // 함정: 감사 로그가 업무 트랜잭션에 묶이면 업무가 롤백될 때 함께 사라진다
    @Test
    void 바깥_트랜잭션이_롤백돼_숨김이_취소돼도_감사_로그는_남는다() {
        Long postId = newPost(newMember(Role.USER));
        authenticate(newMember(Role.ADMIN));

        tx.executeWithoutResult(s -> {
            adminService.hidePost(postId, null);
            s.setRollbackOnly();
        });

        assertThat(jdbc.queryForObject("SELECT status FROM post WHERE id = ?", String.class, postId))
                .isEqualTo("ACTIVE");
        assertThat(details("HIDE_POST", postId)).hasSize(1);
    }

    /**
     * 순서: 메서드 보안(바깥) → 감사 로그 → 트랜잭션(안쪽). 감사 로그가 트랜잭션 바깥이어야 proceed()가 돌아왔을 때
     * 업무가 이미 커밋돼 있다. 안쪽이면 커밋이 실패해도 성공 기록이 남는다.
     */
    @Test
    void 감사_로그_어드바이스는_메서드_보안_안쪽_트랜잭션_바깥에_있다() {
        int order = AnnotationUtils.findAnnotation(AuditLogAspect.class, Order.class).value();

        assertThat(order).isGreaterThan(AuthorizationInterceptorsOrder.PRE_AUTHORIZE.getOrder())
                .isLessThan(transactionAdvisor.getOrder());
    }
}
