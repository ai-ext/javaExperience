package com.example.board.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// URL 규칙(/api/admin/**는 ADMIN)과 서비스의 @PreAuthorize로 이중 방어한다
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, ProblemDetailSecurityHandler handler, JwtProvider jwtProvider)
            throws Exception {
        http
                // 토큰 기반 무상태 API라 세션·CSRF·기본 로그인 화면을 쓰지 않는다
                // CorsFilter를 인증 필터보다 앞에 둬서 preflight(OPTIONS)가 인증에 걸리지 않게 한다
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(new JwtAuthenticationFilter(jwtProvider), UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(e -> e.authenticationEntryPoint(handler).accessDeniedHandler(handler))
                // 위에서부터 처음 매치된 규칙만 적용된다. 구체적인 규칙을 먼저, 마지막은 deny-by-default.
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/auth/signup", "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/popular", "/api/posts/{postId}",
                                "/api/posts/{postId}/comments", "/api/rankings/activity", "/api/shop/items").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // 회원 전용 쓰기 API(글·댓글·좋아요·충전·주문 …). 토큰 없는 쓰기는 여기서 모두 막는다
                        .requestMatchers(HttpMethod.POST, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/**").authenticated()
                        // PG 서버가 보내는 결제 완료 통지. 토큰이 없고 서명(X-PG-Signature)으로 확인한다
                        .requestMatchers(HttpMethod.POST, "/api/pg/callbacks").permitAll()
                        .anyRequest().authenticated());
        return http.build();
    }
}
