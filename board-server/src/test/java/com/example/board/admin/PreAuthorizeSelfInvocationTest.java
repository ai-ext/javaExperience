package com.example.board.admin;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.method.AuthorizationManagerBeforeMethodInterceptor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 함정 재현: @PreAuthorize는 프록시가 검사한다. 같은 클래스 안에서 this로 부르면 프록시를 거치지 않아 USER도 통과한다.
 * 정답 AdminService는 이 구조를 피한다(클래스에 @PreAuthorize, 진입점 메서드가 곧 보호 대상). 가드는 AdminApiTest.
 */
class PreAuthorizeSelfInvocationTest {

    static class Actions {
        @PreAuthorize("hasRole('ADMIN')")
        public String hide() {
            return "숨김";
        }

        // 보호 표시가 없는 진입점이 같은 객체의 보호 메서드를 부른다
        public String hideFromInside() {
            return this.hide();
        }
    }

    Actions proxy;

    @BeforeEach
    void setUp() {
        ProxyFactory factory = new ProxyFactory(new Actions());
        factory.setProxyTargetClass(true);
        // @EnableMethodSecurity가 빈에 붙이는 것과 같은 인터셉터
        factory.addAdvisor(AuthorizationManagerBeforeMethodInterceptor.preAuthorize());
        proxy = (Actions) factory.getProxy();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("user", null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void 프록시를_거쳐_부르면_USER는_막힌다() {
        assertThatThrownBy(proxy::hide).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void 같은_클래스_안에서_this로_부르면_USER도_통과한다() {
        assertThat(proxy.hideFromInside()).isEqualTo("숨김");
    }
}
