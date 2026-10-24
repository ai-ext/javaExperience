# core 담당 공식 근거

확인일: 2026-10-22

## API token 값 대소문자 비교

- [RFC 6750, OAuth 2.0 Bearer Token Usage, §1.1, §2.1](https://www.rfc-editor.org/rfc/rfc6750.html) — 기본 규칙은 별도로 정하지 않는 한 프로토콜 매개변수 이름과 값은 대소문자를 구분한다고 적고, Authorization 헤더의 Bearer credential 문법을 정의한다. [RFC 6749, §1.4](https://www.rfc-editor.org/rfc/rfc6749.html)는 access token을 권한을 나타내는 문자열이며 일반적으로 클라이언트에 불투명하다고 설명한다.
- [RFC 9110, HTTP Semantics, §11.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-11.1) — HTTP authentication scheme을 식별하는 `auth-scheme` 토큰은 대소문자를 구분하지 않는다. 따라서 `Bearer`와 `bearer`는 scheme 이름으로 동등하다.
- [MySQL 8.4 Reference Manual, Collation Naming Conventions](https://dev.mysql.com/doc/refman/8.4/en/charset-collation-names.html) — collation 접미사 `_ci`는 대소문자 비구분, `_ai`는 악센트 비구분을 뜻한다고 명시한다. `utf8mb4_0900_ai_ci`는 대소문자와 악센트를 모두 구분하지 않는다고 설명한다.

1-6의 스냅샷은 `api_token.token`을 일반 `varchar`로 만들고 테이블 기본 collation을 별도 지정하지 않는다. `AuthInterceptor`는 이 문자열을 `ApiTokenRepository.findByTokenFetchMember`의 `t.token = :token`으로 조회한다. 따라서 기본 테이블 collation이 적용되는 환경에서 토큰 문자열의 대소문자를 바꿔도 같은 row가 매치될 것으로 예상된다. 이번 감사에서는 실제 DB 쿼리로 재현하지 않았으며, 기술 동작은 저장소 DDL·JPQL과 MySQL 공식 문서의 collation 의미를 결합한 추론이다. 수정 전에는 MySQL의 실제 column/table collation과 사용 중인 JDBC 비교 결과를 별도 확인해야 한다.

같은 스냅샷의 `AuthInterceptor`는 `Authorization` 헤더를 `startsWith("Bearer ")`로 비교한다. HTTP scheme 이름은 대소문자를 구분하지 않으므로 소문자 `bearer`는 RFC상 같은 scheme이지만 현재 구현은 거절할 것으로 예상된다. 단위 요구 표는 대문자 `Bearer` 형식만 사용한다. 라이브 HTTP 재현은 하지 않았다.

## Spring MVC 요청 매개변수 검증 예외

- [Spring Framework 7.0.9 Reference, Validation](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html) — `@Min` 같은 제약이 controller method parameter에 직접 붙으면 Spring MVC method validation을 적용하고 `HandlerMethodValidationException`을 던진다. 본문 command object의 개별 검증 예외인 `MethodArgumentNotValidException`과 함께 처리하라고 안내한다.
- 이 저장소 snapshot의 공통 `ApiExceptionHandler`는 `MethodArgumentNotValidException`은 직접 다루지만 `HandlerMethodValidationException` handler는 없다. 2-2의 `page`/`size` 제약은 후자 경로다. 입력 오류 status가 400이어야 한다는 동작과 사용자 지정 ProblemDetail body/media type이 그대로 지켜지는지는 다른 조건이므로, 실제 Spring MVC error resolver를 거친 HTTP 응답은 메인 담당자가 격리 실행으로 확인해야 한다. 이번 감사에서는 실행하지 않았다.
