# B01 계정 생명주기 문서 사실 검증

확인일: 2026-10-20. 대상은 B01 사본이다. OWASP, Redis, Oracle JDK, Spring 공식 자료만 확인했다. API·이메일/SMS·Redis 실행 및 컴파일은 하지 않았으며 Redis 동작 검증은 메인의 별도 실행 예정이다.

## 1. 비밀번호 복구와 계정 열거

OWASP는 존재·비존재 계정에 같은 메시지와 일관된 응답 시간을 권고하며 비동기 또는 같은 처리 경로를 예로 든다. 계정 단위 rate limit, CAPTCHA 등으로 이메일/SMS 폭주를 억제한다. 발송비용 상한이나 제한 수치는 정하지 않는다. 동일 `202`/본문은 부합하지만 시간 유사성은 구현·측정 전 보장이 아니다.

토큰/코드는 CSPRNG·충분한 길이·안전한 저장·1회 사용·만료가 필요하다. 요청 `Host` 대신 고정 URL 또는 신뢰 도메인을 쓰고 HTTPS를 적용한다. reset 페이지는 `Referrer-Policy: no-referrer`, URL 토큰 rate limit을 적용한다. 성공 후 기존 세션은 사용자에게 무효화 여부를 묻거나 자동 무효화한다. 이전 reset token 폐기는 타당한 추가 정책이다.

## 2. 짧은 코드와 긴 reset token

6자리 코드는 후보가 백만 개뿐이다. DB 유출 시 단순 SHA-256은 오프라인 전수대입이 쉬워, 별도 보호한 비밀키 HMAC으로 보완한다. 온라인 제한·만료·실패 횟수·원자적 소비는 따로 필요하다. HMAC 자체는 온라인 추측·재전송·소비를 막지 않는다. 32바이트 무작위 reset token은 256비트 공간이므로 digest 저장은 짧은 코드와 위협이 다르다. 만료·1회 소비는 별도 로직이다.

Oracle `SecureRandom`은 암호학적 강도와 비결정 출력을 요구한다. 공개 테스트키, `Clock.fixed`, deterministic random은 재현 편의일 뿐 운영 키·RNG·시계의 안전성을 증명하지 않는다.

## 3. Redis 제한기 의미와 경합 시험

Redis 공식 `INCR` 예제는 `INCR` 다음 `EXPIRE`를 별도 명령으로 실행하는 구현에서 두 명령 사이 중단 시 키가 만료되지 않는 race를 지적하고, 두 연산을 Lua script로 묶는 예를 제시한다. 스크립트는 서버에서 다른 활동을 막고 원자 실행되지만, 이를 “오류가 나도 전체 명령이 rollback된다”는 트랜잭션 rollback으로 확대하면 안 된다. 스크립트 오류 후 앞선 쓰기까지 되돌리는 문서상 보장은 확인하지 못했다. `n == 1`일 때만 EXPIRE하는 패턴은 첫 요청 시점부터 고정 길이 창을 둔다. 매 요청마다 TTL을 갱신하는 슬라이딩 윈도우는 아니다.

예정 실험은 같은 Redis에 연결한 두 독립 client가 동일 키·동일 Lua(INCR 및 최초 EXPIRE)로 동시 N건을 보내고, 응답값·최종값·TTL을 대조한다. 각 앱의 local counter도 따로 관찰해 공유 카운터 효과와 구분한다. 다른 키나 client 하나만으로 동일키 경합을 주장하지 않는다. 메모리·스크립트 캐시·실행시간은 환경과 버전에 따라 달라 일반화하지 않는다.

## 4. DB 경합과 세션 폐기

정규화 이메일의 UNIQUE 제약은 동시 INSERT의 최종 중복 방지점이고, 사전 조회만으로는 경합을 막지 못한다. reset token 소비는 `used_at IS NULL AND expires_at > now` 조건부 UPDATE가 정확히 한 행을 갱신한 요청만 성공으로 처리해야 한다. 성공 요청의 token 소비, 새 password hash 저장, `credential_version` 증가 또는 refresh/session 폐기, 다른 reset token 무효화를 하나의 DB transaction에 넣어야 중간 실패 시 부분 상태를 막는다. 단, 외부 세션 저장소/분산 캐시 무효화가 DB transaction에 자동 포함되는 것은 아니다. Outbox/재검증 등 별도 설계가 필요할 수 있다. stateless JWT는 발급 뒤 서버 상태 조회 없이 검증된다면 비밀번호 변경만으로 자동 폐기되지 않는다. 짧은 만료, 버전 조회, denylist 등 검증 경로가 있어야 차단 가능하다.

## 5. Spring 버전·인증 이벤트

Spring Boot 공식 관리 의존성 표(4.1.1)는 `spring-security-core`, `spring-security-crypto`, `spring-security-web` 등 Spring Security 모듈을 **7.1.1**로 관리한다고 표시한다. Spring Security password storage 문서는 `DelegatingPasswordEncoder` 저장 형식이 `{id}encodedPassword`이며, `matches(CharSequence, String)`가 id에 맞는 encoder로 위임한다고 설명한다. 이 문서의 기본 factory 구성과 앱이 실제 선택한 encoder 설정은 구분해야 한다. `{noop}`는 운영 권고가 아니다.

Spring Security 7.1.1 이벤트 문서는 성공/실패 시 각각 `AuthenticationSuccessEvent` / `AuthenticationFailureEvent`(실패 계열 포함)를 발행하며, servlet API와 독립적으로 감사·관찰에 쓸 수 있다고 설명한다. 이는 응답 본문, HTTP 상태, `Retry-After`를 작성하는 handler와 역할이 다르다. 두 이벤트를 둔다고 handler가 자동 구성되거나 특정 응답이 보장되지 않는다.

## 6. private Redis용 고정 소스

공식 Redis release 목록에서 8.10.2(2026-09-17 게시)를 확인했고, 공식 hash 저장소는 `redis-8.10.2.tar.gz` SHA-256을 `b9ffee226b5eecdba98a679260dad764b2a4ebd90dce4ad5ac9e9f3eef9c02b3`로 기록한다. 고정 소스 URL은 `https://download.redis.io/releases/redis-8.10.2.tar.gz`다. 로컬 컴파일 후보의 식별 정보만 제공한다. 다운로드·컴파일·설치·서비스 영향 확인은 하지 않았다. Redis 8 라이선스는 별도 검토 대상이다.

## 7. 미구현 경계와 오해 방지

예제에는 계약·요구만 있고 실제 보안 보장은 없는 부분이 있다. 연락처 조합/필수 조건, 발송비용 상한 및 수치는 미정이며 이메일·SMS는 보내지 않았다. `VerificationChallengeStore`/reset store의 조건부 소비, 실패횟수 원자 증가, 회원 활성화·password hash·credential version·세션 폐기의 단일 transaction 구현은 없다. DB와 Redis 또는 외부 session 저장소 간 원자성도 자동으로 보장되지 않는다.

정규화·DB collation·UNIQUE와 가입 `409`의 노출 정책을 맞춰야 한다. 온라인 제한의 계정/IP 키, 프록시 신뢰, IPv6, 분산 IP, 미존재 계정 및 Redis 장애 정책은 미구현·미측정이다. 시간 동등성도 측정하지 않았다. Lua는 fixed window이며 오류 rollback이나 memory·실행시간 일반화 근거가 아니다. `SET NX EX` 한 키는 다중 제한 원자성을 입증하지 않는다. stateless JWT에는 별도 폐기 검증 경로가 필요하다.

## 출처
[OWASP Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) · [Redis INCR](https://redis.io/docs/latest/commands/incr/) · [Redis Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/) · [Oracle SecureRandom](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/SecureRandom.html) · [Boot 4.1.1 좌표](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html) · [Spring Security password storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html) · [Security events](https://docs.spring.io/spring-security/reference/servlet/authentication/events.html) · [Redis releases](https://github.com/redis/redis/releases) · [공식 SHA256](https://github.com/redis/redis-hashes)