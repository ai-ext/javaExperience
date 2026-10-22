package com.example.board.admin;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.aspectj.annotation.AspectJProxyFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.board.ApiTestSupport;
import com.example.board.member.AuthMember;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 함정 재현: @Audited는 프록시가 가로챈다. 같은 클래스 안에서 this로 부르거나 private 메서드에 붙이면 기록되지 않는다.
 * 테스트 전용 대상에 운영 AuditLogAspect 빈을 그대로 붙인 프록시로 재현한다. 결과는 0건으로 고정한다.
 * 정답 코드는 컨트롤러(다른 빈)가 AdminService.hidePost를 직접 부른다(가드는 AdminApiTest의 HIDE_POST 1건).
 */
class AuditAspectSelfInvocationTest extends ApiTestSupport {

    static final String ACTION = "SELF_INVOCATION_HIDE";

    static class SelfCallingAdminActions {

        @Audited(action = ACTION, targetType = "POST")
        public void hidePost(Long postId) {
        }

        // 함정: 같은 객체 안에서 this로 부르면 프록시를 거치지 않는다
        public void hideFromInside(Long postId) {
            this.hidePost(postId);
        }

        public void hideViaPrivate(Long postId) {
            hidePrivately(postId);
        }

        // 함정: 프록시는 private 메서드를 가로챌 수 없다
        @Audited(action = ACTION, targetType = "POST")
        private void hidePrivately(Long postId) {
        }
    }

    @Autowired
    AuditLogAspect auditLogAspect;

    SelfCallingAdminActions actions;

    @BeforeEach
    void setUp() {
        AspectJProxyFactory factory = new AspectJProxyFactory(new SelfCallingAdminActions());
        factory.setProxyTargetClass(true);
        factory.addAspect(auditLogAspect);
        actions = factory.getProxy();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new AuthMember(1L, Role.ADMIN), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    int count(Long targetId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM audit_log WHERE action = ? AND target_id = ?", Integer.class,
                ACTION, targetId);
    }

    @Test
    void 프록시를_거쳐_부르면_기록된다() {
        Long targetId = System.nanoTime();

        actions.hidePost(targetId);

        assertThat(count(targetId)).isEqualTo(1);
    }

    @Test
    void 같은_클래스_안에서_this로_부르면_기록되지_않는다() {
        Long targetId = System.nanoTime();

        actions.hideFromInside(targetId);

        int count = count(targetId);
        assertThat(count).isZero();
    }

    @Test
    void private_메서드에_붙이면_기록되지_않는다() {
        Long targetId = System.nanoTime();

        actions.hideViaPrivate(targetId);

        int count = count(targetId);
        assertThat(count).isZero();
    }
}
