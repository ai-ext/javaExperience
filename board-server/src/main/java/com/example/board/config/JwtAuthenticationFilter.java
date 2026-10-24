package com.example.board.config;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.board.common.BusinessException;
import com.example.board.member.AuthMember;

/**
 * 토큰이 없거나 틀려도 여기서 응답하지 않고 인증 없이 다음 필터로 넘긴다.
 * 공개 경로를 막지 않고, 401·403 판단은 인가 규칙과 진입점에 맡긴다.
 * 빈으로 등록하면 서블릿 필터로 한 번 더 걸리므로 SecurityConfig에서 직접 만든다.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(PREFIX)) {
            try {
                AuthMember member = jwtProvider.parse(header.substring(PREFIX.length()));
                var authentication = new UsernamePasswordAuthenticationToken(member, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + member.role().name())));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (BusinessException e) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
