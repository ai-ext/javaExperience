# S12. Spring Security 아키텍처

> Spring Security는 Servlet 필터 체인 안에서 인증과 인가를 수행한다.
> `SecurityContext`는 현재 실행 중인 요청의 주체를 전달하고, 컨텍스트 저장소가 다음 요청에 인증을 이어 준다.
> 기본 보안 설정을 유지하고, 공개 경로·암호·CSRF·CORS·세션 정책을 의도에 맞게 좁혀라.

## 1. 왜 알아야 하나

로그인 사용자가 `/admin`에 접근했는데 403이 난다. 원인은 `ROLE_ADMIN` 권한 누락일 수도, URL 규칙보다 먼저 일치한 다른 `SecurityFilterChain`일 수도 있다. Controller만 디버깅하면 필터 단계의 원인을 놓친다.

CORS와 CSRF를 혼동해 CSRF를 끄면, 브라우저가 자동 전송하는 쿠키로 악성 사이트가 상태 변경 요청을 시도할 수 있다. 반대로 preflight `OPTIONS`는 세션 쿠키 없이 도착하므로 CORS보다 Security가 먼저 거절하면 정상 프론트엔드도 API를 호출하지 못한다.

`SecurityContextHolder`는 기본적으로 스레드 로컬이다. 비동기 실행으로 스레드가 바뀌면 전파가 보장되지 않으며, 다음 요청의 인증은 별도 저장소에서 복원된다. 종료 시 컨텍스트를 지우는 이유도 설명할 수 있어야 한다.

## 2. 핵심 개념

| 용어 | 역할 |
|---|---|
| `DelegatingFilterProxy` | 서블릿 컨테이너에 등록되는 브리지 필터. Spring 빈인 `springSecurityFilterChain`에 작업을 위임한다. |
| `FilterChainProxy` | Spring Security의 중심 필터. 여러 `SecurityFilterChain` 중 요청에 맞는 체인을 고르고, 방화벽 처리와 컨텍스트 정리 같은 공통 작업을 맡는다. |
| `SecurityFilterChain` | 요청 매처와 그 요청에 적용할 보안 필터 목록의 조합. 여러 체인이 있으면 **첫 번째로 일치한 하나만** 실행된다. |
| `Authentication` | 인증 전에는 자격 증명 입력, 인증 후에는 사용자 주체와 권한을 담는 객체. `isAuthenticated()` 상태를 구분해야 한다. |
| `AuthenticationManager` | 필터가 인증을 요청하는 상위 인터페이스. 대표 구현체는 `ProviderManager`다. |
| `AuthenticationProvider` | 특정 인증 방식의 검증 담당자. `supports()`로 토큰 종류를 판단하고 인증 성공 또는 실패를 반환한다. |
| `UserDetailsService` | 사용자 이름으로 저장된 사용자 정보와 인코딩된 비밀번호를 조회한다. 비밀번호 검증 자체는 보통 `DaoAuthenticationProvider`와 `PasswordEncoder`가 한다. |
| `SecurityContext` | 현재 인증 객체를 담는 컨테이너. |
| `SecurityContextHolder` | 현재 실행 컨텍스트에서 `SecurityContext`를 조회·설정하는 접근점. 기본 전략은 스레드 로컬이다. |
| `GrantedAuthority` | 역할, 권한 등 인가 판단에 사용할 문자열 권한. `hasRole("ADMIN")`은 관례상 `ROLE_ADMIN` 권한을 찾는다. |
| `SecurityContextRepository` | 요청 사이에 보안 컨텍스트를 읽고 저장한다. 세션 기반 앱에서는 HTTP 세션에 저장할 수 있다. |
| `AuthorizationManager` | 요청 또는 메서드 호출을 허용할지 결정하는 구성 요소. |

### 헷갈리는 경계

| 비교 | 구분 |
|---|---|
| 서블릿 `Filter` vs Spring MVC `HandlerInterceptor` | 필터는 `DispatcherServlet` 앞에서 동작해 MVC 밖의 요청에도 적용된다. 인터셉터는 MVC가 핸들러를 선택하는 과정에 결합된다. Spring Security의 인증·인가 주 경로는 필터다. |
| `FilterChainProxy` vs `SecurityFilterChain` | 전자는 여러 체인을 선택·실행하는 단일 중심 필터, 후자는 요청별 보안 규칙과 보안 필터 묶음이다. |
| 인증 vs 인가 | 인증은 “누구인가”를 검증해 `Authentication`을 만든다. 인가는 이미 알려진 주체가 “이 요청/메서드를 실행해도 되는가”를 판단한다. |
| `SecurityContextHolder` vs `SecurityContext` | Holder는 접근 전략을 제공하고, Context는 실제 `Authentication`을 보관한다. |
| CORS vs CSRF | CORS는 브라우저의 교차 출처 응답 접근 정책이다. CSRF는 브라우저가 자동 첨부하는 쿠키 등 인증 정보를 악용한 위조 요청 방어다. CORS 허용이 CSRF 방어가 되지 않는다. |

## 3. 내부 동작·원리

### 필터 체인 진입과 선택

```text
브라우저
  │ HTTP 요청
  ▼
서블릿 컨테이너 FilterChain
  ├─ DelegatingFilterProxy (보통 springSecurityFilterChain 이름으로 등록)
  │    └─ Spring 빈 FilterChainProxy
  │          ├─ HttpFirewall로 요청 검사
  │          ├─ SecurityFilterChain 매처를 순서대로 평가
  │          └─ 첫 일치 체인의 Security Filter들만 호출
  └─ DispatcherServlet → Controller
```

컨테이너는 Spring 빈 생명주기를 모르지만 Security 필터는 의존성 주입이 가능한 Spring 빈이어야 한다. `DelegatingFilterProxy`가 둘을 연결하고, 컨테이너의 필터 등록 시점과 실제 빈 조회 시점을 분리한다.

`FilterChainProxy`는 보안 필터의 진입점을 모으고 `RequestMatcher` 기반 선택, 방화벽, 컨텍스트 정리를 중앙 처리한다. `/api/**` 체인이 앞에 있으면 `/api/orders`에는 그 체인만 적용된다. `permitAll()`은 인가 허용이고 Security 체인 제외는 보호 필터를 건너뛸 수 있어 보안 공백이 된다.

### 사용자 이름/비밀번호 인증 흐름

```text
UsernamePasswordAuthenticationFilter
  → 미인증 UsernamePasswordAuthenticationToken 생성
  → AuthenticationManager (대개 ProviderManager)
      → 지원하는 AuthenticationProvider 선택
          → UserDetailsService.loadUserByUsername()
          → PasswordEncoder.matches(입력 비밀번호, 저장된 해시)
      ← 인증된 Authentication 또는 예외
  → 성공 핸들러 / SecurityContext에 인증 저장
  → 다음 필터와 DispatcherServlet
```

`AuthenticationManager`가 직접 모든 검증을 하지는 않는다. `ProviderManager`는 토큰을 지원하는 provider에 위임하며 아이디/비밀번호는 보통 `DaoAuthenticationProvider`가 처리한다.

Provider는 `UserDetailsService`에서 계정과 해시를 얻고 `PasswordEncoder.matches`로 비교한다. 저장 비밀번호를 복호화하지 않으며, 외부 오류는 계정 존재 여부를 드러내지 않는 편이 안전하다.

인증 정보는 `SecurityContext`에 들어간다. 세션 기반 기본 설정은 저장소가 요청 간 인증을 저장·복원하지만, 커스텀 필터나 Controller가 직접 설정할 때는 저장소에 기록해야 후속 요청에도 남는다. 현재 스레드의 Holder만 수정하면 다음 요청에선 사라질 수 있다.

### 세션 수명과 고정 공격

세션 인증에서는 인증 전 세션 ID를 로그인 뒤에도 재사용하는 세션 고정 공격을 막아야 한다. 기본 보안 설정은 인증 뒤 세션 ID 변경 등 세션 고정 방어를 적용한다.

세션 생성 정책은 `IF_REQUIRED`(필요할 때 생성), `NEVER`(새로 만들지 않되 기존 세션 사용), `STATELESS`(SecurityContext 저장에 `HttpSession`을 사용하지 않음)처럼 구분한다. `STATELESS`여도 애플리케이션의 다른 코드가 세션을 만들 수 있다.

### 로그인부터 로그아웃까지 (보강)

세션 로그인은 인증 한 번으로 끝나지 않는다. 요청마다 브라우저가 보낸 세션 쿠키를 서버의 세션과 연결하고, 그 세션에 저장된 `SecurityContext`를 복원해 인가한다. 다음은 서버 렌더링 웹 애플리케이션의 전형적인 흐름이다.

1. 익명 브라우저가 로그인 페이지를 연다. CSRF 토큰을 세션에 저장하는 기본 구성에서는 이 단계에서 세션이 생길 수 있고, 응답은 세션 쿠키를 돌려준다.
2. 브라우저가 로그인 폼을 제출한다. 자격 증명과 CSRF 토큰이 검증되면 인증 필터가 `Authentication`을 만들고 세션에 인증 컨텍스트를 보존한다. 인증 전 쿠키를 계속 쓰지 않도록 세션 ID를 회전한다. 서블릿 컨테이너가 지원하는 `changeSessionId` 방식은 세션 속성을 유지하면서 ID만 바꾼다.
3. 이후 `/account/**` 요청에 브라우저가 새 쿠키를 자동 첨부한다. 서버는 그 세션의 인증을 복원한 뒤 URL 인가 규칙을 평가한다. 로그인됐어도 권한이 부족하면 접근은 거부된다.
4. 유휴 만료 시간이 지나면 서버 세션은 만료된다. 다음 요청의 쿠키 값만으로 이전 인증이 되살아나지 않으며, 사용자는 익명으로 처리된다. 만료 안내 URL을 둘 수 있지만 세션 쿠키가 남아 있으면 로그아웃 직후 요청도 만료 요청처럼 보일 수 있다.
5. 로그아웃은 CSRF 토큰을 포함한 `POST /logout`으로 요청한다. 기본 로그아웃 처리는 세션을 무효화하고 보안 컨텍스트와 CSRF 토큰을 정리한 다음 성공 페이지로 보낸다. 변경 작업을 로그아웃과 같은 `GET`으로 만들지 않는다.

아래 설정은 Spring Boot 4.1 / Java 25의 폼 로그인 예다. 기존 `UserDetailsService`처럼 세션 사용자를 조회할 수 있는 빈이 있어야 동시 세션 제한을 사용자별로 적용할 수 있다.

```java
package example.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.session.HttpSessionEventPublisher;

@Configuration
public class BrowserSessionConfiguration {
    @Bean
    SecurityFilterChain browser(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/assets/**", "/session-expired").permitAll()
                .requestMatchers("/account/**").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(Customizer.withDefaults())
            .sessionManagement(session -> session
                .sessionFixation(fixation -> fixation.changeSessionId())
                .invalidSessionUrl("/session-expired")
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
            )
            .logout(logout -> logout
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .logoutSuccessUrl("/login?logout")
            );
        // 기본 CSRF 보호를 유지한다.
        return http.build();
    }

    @Bean
    HttpSessionEventPublisher httpSessionEventPublisher() {
        return new HttpSessionEventPublisher();
    }
}
```

`maximumSessions(1)`과 `maxSessionsPreventsLogin(false)`는 새 로그인 시 기존 세션을 만료시킨다. `true`로 바꾸면 이미 한 세션이 있을 때 새 로그인을 거부한다. 계정 공유가 허용된 것처럼 보이는 동작을 정책으로 정하고, 사용자에게 세션 종료 사실을 안내한다.

기본 세션 레지스트리는 메모리 기반이므로 서버를 여러 대 운영하면 인스턴스 간 제한이 일치하지 않을 수 있다. 클러스터에서는 Spring Session 같은 공유 세션 저장소와 그 환경에 맞는 동시성 구성을 검토한다.

세션 만료와 쿠키 보안 속성은 애플리케이션 설정으로 명시할 수 있다.

```yaml
server:
  servlet:
    session:
      timeout: 20m
      cookie:
        http-only: true
        secure: true
        same-site: lax
```

`HttpOnly`는 스크립트가 세션 쿠키 값을 읽기 어렵게 하지만 XSS가 브라우저를 대신해 요청을 보내는 것까지 막지는 않는다. `Secure`는 HTTPS에서만 쿠키를 보내게 하므로 운영 HTTPS 환경에 맞춘다.

`SameSite=Lax`는 일반적인 웹 화면에 출발점으로 쓸 수 있지만 CSRF 토큰을 대신하지 않는다. 외부 사이트를 왕복하는 로그인 흐름은 `Strict`에서 깨질 수 있고, 교차 사이트 쿠키를 꼭 써야 하는 `None`은 `Secure`와 CSRF 방어를 함께 요구한다.

세션 기반 CSRF 보호를 유지하면 상태 변경 폼도 토큰을 보내야 한다. Spring MVC/Thymeleaf 폼의 명시적 예는 다음과 같다.

```html
<form th:action="@{/account/email}" method="post">
  <input type="email" name="email">
  <input type="hidden" th:name="${_csrf.parameterName}"
         th:value="${_csrf.token}">
  <button type="submit">저장</button>
</form>
```

함정은 쿠키 옵션을 CSRF 정책으로 오해하는 것이다. `SameSite`는 브라우저의 쿠키 전송 조건을 좁히는 보조 수단이고, 쿠키 인증을 쓰는 상태 변경 요청에는 Spring Security의 CSRF 검증과 유효한 토큰이 필요하다.

반대로 인증이 필요한 화면 이동은 CSRF 토큰을 추가하는 것으로 권한 검사가 대체되지 않는다. 세션 만료 시간, 쿠키 속성, 로그아웃 시 세션 무효화를 함께 점검하고, 개발 HTTP 환경에서는 `secure: true` 쿠키가 전송되지 않는 점도 확인한다.

참고: Authentication Persistence and Session Management — https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html
참고: Handling Logouts — https://docs.spring.io/spring-security/reference/servlet/authentication/logout.html
참고: Common Application Properties — https://docs.spring.io/spring-boot/4.1/appendix/application-properties/index.html

### 컨텍스트 수명과 스레드

기본 Holder는 `ThreadLocal`을 사용한다. 동기식 요청에서 필터와 Controller가 주체를 쉽게 조회할 수 있다. 종료 시 `FilterChainProxy`가 이를 지워 풀 스레드가 재사용될 때 앞 사용자 인증이 섞이지 않게 한다. 저장소 보존과 스레드 로컬 정리는 별개다.

`@Async`, 임의의 `Executor`, 새 스레드에는 보통 기존 컨텍스트가 자동 전달되지 않는다. 전파 지원을 쓰거나 필요한 주체 정보를 인자로 넘긴다. 전역 `InheritableThreadLocal` 변경은 풀 스레드의 수명을 고려하지 않으면 오히려 위험하다.

### 인가 흐름

`authorizeHttpRequests`는 규칙을 순서대로 평가한다. `AuthorizationFilter`는 인증 공급자와 요청을 `AuthorizationManager`에 전달한다. 허용이면 진행하고 거부면 예외가 발생한다. `ExceptionTranslationFilter`는 익명 사용자를 로그인으로, 인증된 사용자의 거부를 `AccessDeniedHandler`로 연결하므로 401/로그인과 403은 다르다.

HTTP 규칙은 URL을, 메서드 보안은 서비스 작업을 보호한다. `@EnableMethodSecurity`와 `@PreAuthorize`는 프록시 AOP로 인가하며 Boot starter가 자동 활성화하지 않는다. `this.otherSecuredMethod()` 같은 자기 호출은 프록시를 우회할 수 있으므로 서비스 경계를 나눈다.

## 4. 코드로 확인

다음 코드는 Spring Boot 4.1.x가 관리하는 Spring Security 7.1.1 기준 예시다. 예제는 웹 애플리케이션에 넣는 설정 코드이며 여기서 실행하지 않았다. 운영에서는 메모리 사용자를 실제 사용자 저장소로 교체한다.

### 예제 1: HTTP 요청 규칙과 기본 로그인

```java
package example.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class WebSecurityConfiguration {
    @Bean
    SecurityFilterChain web(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/assets/**", "/health").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(Customizer.withDefaults());
        // CSRF 방어는 기본 활성화 상태로 둔다.
        return http.build();
    }
}
```

규칙은 구체적인 공개·관리자 경로부터 넓은 `anyRequest()` 순으로 쓴다. 역할이 필요한 URL이 먼저 `authenticated()`와 매칭되면 아래의 관리자 규칙은 도달하지 않는다. 단순히 로그인 여부만 필요한 화면과 역할/권한이 필요한 작업을 분리한다. `(미실행)`

### 예제 2: 비밀번호 인코더와 사용자 조회

```java
package example.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration
public class IdentityConfiguration {
    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(PasswordEncoder encoder) {
        var reader = User.withUsername("reader")
            .password(encoder.encode("replace-this-secret"))
            .roles("USER")
            .build();
        return new InMemoryUserDetailsManager(reader);
    }
}
```

`DelegatingPasswordEncoder`는 저장값 앞에 `{id}`를 붙여 어떤 인코더로 검증할지 식별한다. 알고리즘 전환 중 구형 해시도 읽으면서 새 비밀번호는 현재 기본 인코더로 저장하는 데 유리하다. 예제 문자열은 데모용이며 실제 계정 암호나 설정 파일에 둘 비밀값으로 사용하지 않는다. `(미실행)`

## 5. 버전별 변화 — 왜 바뀌었나

| 시점 | 변화와 배경 |
|---|---|
| Spring Security 5 → 6 (2022) | 인증 컨텍스트 저장을 명시적으로 다루는 모델이 기본이 되면서 세션 관리에서 `SecurityContextHolderFilter` 중심 흐름을 사용하고, `SecurityContextPersistenceFilter`와 `SessionManagementFilter`는 기본 등록되지 않는다. 이전의 매 요청 저장 동작은 인증 필터가 컨텍스트를 저장하는 시점을 흐리게 만들고 추가 세션 조회도 일으킬 수 있었다. 커스텀 인증 필터는 `SecurityContextRepository` 저장 여부를 확인해야 한다. 근거: [세션 관리 참조](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html). |
| Spring Security 6.x → 7.0 (2025) | 6.5가 6.x 마지막 세대이고 7.0은 더 이상 사용하지 않는 API를 제거한 주요 버전이다. HTTP 설정의 `and()`와 구식 `authorizeRequests`가 제거되어 lambda DSL과 `authorizeHttpRequests`로 옮겨야 한다. 모듈화 설정을 지원하고 SPA용 CSRF 구성도 추가했다. 기존 중첩 설정의 문맥이 길어지고 인가 API가 구형 결정 모델에 묶여 있던 점을 정리한다. 근거: [7.0 변경점](https://docs.spring.io/spring-security/reference/7.0-SNAPSHOT/whats-new.html), [마이그레이션](https://docs.spring.io/spring-security/reference/migration/index.html). |
| Spring Security 7.0 웹 매처 변화 | `MvcRequestMatcher`, `AntPathRequestMatcher`가 `PathPatternRequestMatcher`로 대체된다. 경로 매칭 일관성을 높이기 위한 변경이며 커스텀 매처와 패턴을 점검한다. 근거: [7.0 변경점](https://docs.spring.io/spring-security/reference/7.0-SNAPSHOT/whats-new.html). |
| 7.0 코어 변화 | `AuthorizationManager#check`가 `authorize`로 대체되고 `Authentication.Builder` 및 다중 인증 요소 지원이 추가됐다. 커스텀 인가 구현을 새 API에 맞춘다. 근거: [7.0 변경점](https://docs.spring.io/spring-security/reference/7.0-SNAPSHOT/whats-new.html). |
| 기준 버전: Boot 4.1.1 | 공통 브리프 기준 Boot 4.1.1 관리 버전은 Spring Security 7.1.1이다. 7.0 문서에 있던 개발 중 표기는 현재 안정 버전을 확인해 해석한다. 버전은 기억으로 올리지 말고 BOM과 공식 안정 문서를 기준으로 맞춘다. |

## 6. 실무 가이드

- 기본값 추천: Boot의 Spring Security 기본 방어를 제거하지 말고, `SecurityFilterChain` 빈에서 URL 규칙을 좁혀 정의하며 비밀번호에는 `PasswordEncoderFactories.createDelegatingPasswordEncoder()`를 사용한다. 사용자 조회 구현은 저장소에 맞게 교체한다.
- if 로그인 폼·세션 쿠키를 쓰면 then CSRF 보호를 유지하고, 상태 변경 요청이 토큰을 제출하도록 구성한다. 쿠키는 브라우저가 자동 첨부할 수 있다.
- if 브라우저 프론트엔드와 다른 출처의 API를 연결하면 then 정확한 origin과 메서드·헤더만 CORS에 허용하고 `.cors(withDefaults())` 등으로 Security 앞단에서 처리한다. CORS와 CSRF 설정을 같은 허용 목록으로 취급하지 않는다.
- if API와 웹 화면의 정책이 다르면 then `securityMatcher`가 설정된 별도 `SecurityFilterChain`을 만들고, 더 구체적인 체인을 먼저 둔다. 각 체인에 최종 `anyRequest` 정책과 체인 매처 범위를 검토해 무보안 요청이 남지 않는지 확인한다.
- if 권한이 특정 서비스 작업이나 객체 소유권에 달렸다면 then `@EnableMethodSecurity`와 메서드 인가를 함께 쓴다. HTTP 규칙은 진입 경로를 보호하고 메서드 규칙은 작업 경계를 보호한다.
- if 커스텀 인증 필터에서 인증을 만들면 then 빈 `SecurityContext`를 만들어 `Authentication`을 넣고, 구성된 `SecurityContextRepository`에 저장한다. 성공 핸들러에서 저장하는 방식인지 필터가 저장하는 방식인지 한 곳으로 정한다.
- if 비동기 작업에서 호출 사용자 권한이 필요하면 then 지원되는 컨텍스트 전파기를 명시하거나 필요한 식별·권한 값을 작업 인자로 전달한다. 작업이 끝난 뒤 권한을 계속 보유하지 않도록 실행 범위를 제한한다.
- if 비밀번호 해시 정책을 바꾸면 then `{id}`가 붙은 `DelegatingPasswordEncoder`를 사용하고 구형 해시 검증과 로그인 시 재인코딩 경로를 마련한다. 빠른 단순 SHA-256 해시를 비밀번호 저장용으로 선택하지 않는다.
- if 세션 인증 정책을 `STATELESS`로 바꾸면 then 애플리케이션 전체에서 세션·쿠키 인증에 의존하는 기능이 없는지 확인한다. 로그인 화면이나 CSRF 방식도 함께 재검토한다. 토큰 표준과 OAuth2 흐름은 S13을 참조한다.

## 7. 함정·안티패턴

1. **관리자 규칙이 먹지 않음** → 앞선 `requestMatchers("/**")` 또는 일반 요청 규칙이 먼저 매칭 → 넓은 매처는 마지막에 두고 체인/규칙 순서를 통합 점검한다.
2. **두 필터 체인이 모두 실행된다고 가정** → `FilterChainProxy`는 요청마다 첫 일치 `SecurityFilterChain` 하나만 선택 → API 체인과 기본 체인의 매처가 겹치는 경로를 기록하고 순서를 테스트한다.
3. **`permitAll()`이면 보안 필터도 생략된다고 생각함** → 접근 결정만 허용하며 CSRF, 보안 헤더 등 다른 필터는 여전히 적용될 수 있음 → 공개 정적 자원도 요구사항을 따져 허용하고 `WebSecurityCustomizer.ignoring()`으로 통째로 우회하지 않는다.
4. **CSRF를 CORS로 막았다고 판단** → CORS는 브라우저의 응답 읽기를 제어할 뿐이며 쿠키를 동반한 위조 요청 차단을 대신하지 못함 → 쿠키/세션 로그인에는 CSRF 토큰을 유지한다.
5. **preflight가 401/403** → 인증 쿠키 없는 `OPTIONS` 요청보다 Security가 먼저 판정함 → Security의 CORS 통합과 제한된 CORS 정책을 설정한다.
6. **로그인 후 다음 요청은 익명** → 커스텀 필터가 ThreadLocal 컨텍스트만 설정하고 저장소에 기록하지 않음 → `SecurityContextRepository`의 load/save 계약과 명시적 저장을 확인한다.
7. **사용자 정보가 다른 요청에서 보이거나 비동기에서 사라짐** → 재사용 스레드의 ThreadLocal 정리를 놓쳤거나 새 스레드로 컨텍스트가 전파될 것이라 가정 → 컨텍스트를 수동으로 지우고, 지원되는 전파 방식 또는 명시적 작업 인자를 쓴다.
8. **인코더 변경 후 모든 로그인이 실패** → 저장 해시에는 `{id}`가 없거나 해당 인코더가 매핑되어 있지 않음 → 이행 기간에 사용할 인코더 매핑과 로그인 후 재해시 절차를 제공한다.
9. **메서드 애노테이션이 무시됨** → 메서드 보안을 켜지 않았거나 자기 호출로 프록시를 우회함 → `@EnableMethodSecurity`를 설정하고 다른 Spring 빈의 프록시 경계를 통해 진입하게 나눈다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. `DelegatingFilterProxy`와 `FilterChainProxy`의 역할을 구분해 설명하라.

`DelegatingFilterProxy`는 컨테이너 필터 진입점이며 Spring 빈에 처리를 위임한다. `FilterChainProxy`는 요청별 `SecurityFilterChain` 선택과 공통 작업을 맡는 중심 필터다. 전자는 연결, 후자는 체인 실행 책임이다.

**꼬리질문: 보안 로그가 예상과 다르면 어디부터 확인하나?**

우선 `FilterChainProxy`가 요청을 어떤 체인으로 보냈는지 본다. 선택된 체인, 매처 순서, 그 안의 필터 순서를 확인한 뒤 Controller에 도달했는지 추적한다.

### Q2. `AuthenticationManager`와 `AuthenticationProvider`를 나눈 이유는?

필터는 인증을 요청하는 공통 인터페이스만 알면 된다. `ProviderManager`는 제출된 `Authentication` 종류를 지원하는 provider에 처리를 맡긴다. 그래서 폼 로그인, 사전 인증 등 인증 방식별 검증을 조합할 수 있다. 각각의 provider는 지원하지 않는 토큰을 처리하지 않는다.

**꼬리질문: `UserDetailsService`는 비밀번호를 검증하나?**

주로 사용자 이름으로 계정 정보를 조회해 돌려준다. 아이디/비밀번호 기본 흐름에서는 `DaoAuthenticationProvider`가 조회 결과와 `PasswordEncoder`를 사용해 입력 비밀번호를 비교한다.

### Q3. 인증 후 컨텍스트를 `SecurityContextHolder`에 넣으면 왜 충분하지 않을 수 있나?

Holder의 기본 저장은 스레드 로컬이라 현재 실행 스레드에서만 보인다. 후속 HTTP 요청은 다른 스레드일 수 있으므로 `SecurityContextRepository`에 인증을 저장해 복원해야 한다. 커스텀 필터에서 ThreadLocal만 수정하면 같은 요청 안에서는 동작하고 다음 요청에서 익명으로 돌아가는 버그가 난다. `FilterChainProxy`의 종료 정리는 풀 스레드 간 인증 누출을 방지한다.

**꼬리질문: 비동기 작업은 어떻게 주체 정보를 받나?**

지원되는 보안 컨텍스트 전파 래퍼를 명시적으로 사용하거나 필요한 사용자 식별·권한을 작업 인자로 전달한다. 요청 이후에도 불필요한 권한을 남기지 않게 작업 범위를 정한다.

### Q4. `permitAll()`과 Security 필터 체인 제외는 어떻게 다른가?

`permitAll()`은 일치하는 인가 규칙이 접근을 허용하는 것이다. CSRF·헤더·컨텍스트 관련 필터는 체인에서 계속 동작할 수 있다. 필터 체인 제외는 Security 처리 자체를 건너뛰게 만들 수 있어 보호 기능도 함께 없어질 수 있다. 공개 URL이라도 어떤 필터가 필요한지 판단해야 한다.

**꼬리질문: 체인 두 개의 매처가 모두 맞으면 둘 다 적용되나?**

아니다. `FilterChainProxy`가 앞에서부터 검사해 처음 일치한 체인 하나를 선택한다. 구체적인 체인을 앞에 두고 기본 체인을 뒤에 둔다.

### Q5. CORS preflight와 CSRF를 함께 다룰 때 핵심은?

preflight는 보통 세션 쿠키 없이 오는 `OPTIONS` 요청이므로 CORS 처리가 Security의 인증 판정보다 먼저 이뤄져야 한다. 허용 origin·method·header는 실제 프론트엔드 요구 범위로 제한한다. CSRF는 브라우저의 자동 인증 정보 첨부를 이용하는 상태 변경 위조를 막으므로 쿠키 인증을 쓴다면 별도 토큰 검증을 유지한다. CORS 허용만으로 CSRF를 방어하지 못한다.

**꼬리질문: `allowCredentials(true)`와 `*` origin을 같이 써도 되나?**

자격 증명을 허용하는 CORS에서는 출처를 와일드카드가 아닌 구체적인 origin 목록으로 제한한다. 프레임워크와 브라우저 정책이 자격 증명 응답의 와일드카드 출처를 허용하지 않는다.

### Q6. `hasRole("ADMIN")`인데 권한이 거부되는 흔한 이유는?

`hasRole`은 기본적으로 `ROLE_` 접두사를 붙여 `ROLE_ADMIN` 권한을 검사한다. 사용자에게 `ADMIN` 문자열만 부여했다면 일치하지 않는다. 사용자 권한 데이터와 규칙을 같은 표기로 맞추고, 먼저 매칭되는 URL 규칙도 살핀다. 인증 성공과 필요한 권한 보유는 별개다.

**꼬리질문: `hasAuthority("ADMIN")`는 무엇이 다른가?**

`hasAuthority`는 전달한 권한 문자열을 그대로 비교한다. 역할 접두사 규약을 적용하지 않으므로 저장된 권한값과 정확히 맞춰야 한다.

### Q7. HTTP 인가와 메서드 인가를 둘 다 쓰는 이유는?

HTTP 인가는 외부 진입 경로와 인증 필요 여부를 선언하기 좋다. 메서드 인가는 서비스 작업과 입력 객체의 소유권처럼 URL만으로 표현하기 어려운 조건을 보호한다. 같은 서비스 메서드가 여러 Controller에서 호출돼도 작업 경계 정책을 재사용할 수 있다. 다만 메서드 프록시 자기 호출은 보안 검사를 통과하지 않을 수 있다.

**꼬리질문: Boot Security starter가 메서드 보안도 켜 주나?**

아니다. `@EnableMethodSecurity`로 명시적으로 활성화해야 한다.

### Q8. 비밀번호 저장에 빠른 SHA-256 해시를 쓰면 안 되는 까닭은?

SHA-256 같은 범용 해시는 계산이 빨라 공격자가 유출된 해시에 대해 많은 후보를 시도할 수 있다. 비밀번호 저장에는 salt와 의도적으로 비용을 조절한 적응형 해시가 필요하다. `DelegatingPasswordEncoder`는 알고리즘 식별자와 여러 인코더를 함께 다뤄 점진적인 전환에 유리하다. 저장된 암호문을 복호화하는 설계가 아니다.

**꼬리질문: 알고리즘 정책을 올릴 때 기존 사용자는 어떻게 하나?**

기존 `{id}` 해시를 검증할 수 있도록 이전 인코더를 잠시 유지하고, 로그인 성공 시 새 정책으로 다시 인코딩해 저장한다. 모든 사용자의 평문 비밀번호를 알 수 없으므로 배치 복호화는 불가능하다.

## 9. 참고문헌

- Architecture — https://docs.spring.io/spring-security/reference/servlet/architecture.html — 필터 연결과 체인 선택.
- Servlet Authentication Architecture — https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html — 인증 구성 요소 관계.
- Authorize HttpServletRequests — https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html — 요청 인가 처리.
- Method Security — https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html — 프록시 기반 메서드 인가.
- Password Storage — https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html — 단방향 비밀번호 저장.
- CSRF — https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html — 기본 보호와 토큰 처리.
- CORS — https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html — preflight와 Security 통합.
- Authentication Persistence and Session Management — https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html — 컨텍스트 저장과 세션 관리.
- Java Configuration — https://docs.spring.io/spring-security/reference/servlet/configuration/java.html — 기본 보안 구성.
- Migrating to 7.0 — https://docs.spring.io/spring-security/reference/migration/index.html — 7.0 전환 단계 및 최신 안정 버전 확인.
- What’s New in Spring Security 7.0 — https://docs.spring.io/spring-security/reference/7.0-SNAPSHOT/whats-new.html — lambda DSL, API 제거 및 7.0 모듈·인가 변경 요약.

JWT·OAuth2·OIDC 흐름은 → S13 참조.
