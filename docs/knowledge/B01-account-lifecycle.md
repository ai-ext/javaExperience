# B01. 계정 생명주기 API — 이메일·휴대폰 인증, 비밀번호 재설정, 로그인 시도 제한

> 가입은 `PENDING → ACTIVE`, 코드는 만료·1회 사용.
> reset 토큰은 해시 저장, 계정 유무는 응답에 숨김.
> 계정·IP 공유 카운터로 로그인을 제한한다.

## 1. 한 줄로 말하면

계정 생명주기 API는 가입·연락처 인증·비밀번호 복구·로그인 실패를 상태 전이로 다룬다. 입력만으로 계정을 활성화하지 않고, 만료·횟수·1회 사용을 원자적 갱신으로 보장한다.

## 2. 당장 알아야 할 것

1. **가입 상태는 `PENDING → ACTIVE`다.** 필수 연락처가 인증될 때 활성화하고 미인증 가입은 만료 처리한다.

2. **이메일 중복은 DB가 판정한다.** 정규화 후 `UNIQUE`를 두고 충돌은 `409`; 복구 응답은 등록 여부와 무관하게 같다.

3. **짧은 코드는 온라인 제한이 전제다.** `SecureRandom` 6자리, 5~10분 TTL, 입력 횟수 제한을 두고 HMAC-SHA-256으로 저장한다. 단순 SHA-256은 백만 후보를 전수 대입할 수 있다.

4. **재전송은 이전 코드를 폐기한다.** 연락처별 쿨다운·일일 상한·IP 제한을 두고 SMS 펌핑에는 비용 상한을 적용한다.

5. **복구 응답으로 계정 유무를 감춘다.** 본문·상태·시간을 맞추고 32 random bytes 토큰은 digest로 저장해 짧게 1회 사용한다.

6. **비밀번호 변경과 세션 폐기를 묶는다.** 새 해시를 저장하고 refresh token/session을 폐기한다. stateless access token은 버전 조회나 폐기목록으로 차단한다.

7. **무차별 대입·크리덴셜 스터핑은 계정 + IP 제한을 조합한다.** IP 단독은 분산 공격에 약하고 영구 잠금은 DoS에 쓰인다. 일시 잠금이나 지수 지연을 적용한다.

8. **여러 인스턴스는 공유 카운터를 쓴다.** Redis Lua에서 `INCR`와 첫 `EXPIRE`를 묶어 노드별 우회와 무기한 키를 막는다.

9. **감사 로그에는 비밀값을 넣지 않는다.** 결과·시각·요청 ID만 남기고 비밀번호·코드·토큰은 제외한다. IP·연락처는 최소 수집·마스킹한다.

## 3. 따라 하기

> **이 저장소에 없는 실습 환경** — 이 문서의 예제는 원래 공부자료가 전제한 쇼핑몰 연습 DB `ds_practice`(`practice/schema/schema.sql`·`seed.sql`로 만드는 `member`·`product`·`orders` 등)를 쓴다. 그 파일과 DB는 이 저장소에 없다. 그대로 따라 하려면 그런 MySQL을 직접 준비해야 하고, 명령에 적힌 포트(`3306` 등)·계정도 그때 정한 값으로 바꾼다. 이 저장소에서 바로 쓸 수 있는 DB는 루트 `compose.yaml`의 MySQL(`docker compose up -d` — 호스트 `localhost:13308`, 계정 `community`/`community`, DB `community`·`practice`·`project`)이고, 테이블은 게시판용(`member`·`post`·`comment`·`tag` 등)이라 이름과 열이 다르다.

아래 구성은 Java 25, Spring Boot 4.1.1, Spring Security 7.1.1 기준이다. Boot 관리 버전은 개별로 덮어쓰지 않는다. 스키마는 `practice/schema/schema.sql`의 MySQL `member`를 확장한다.

### 3.1 의존성·로컬 확인 환경

`build.gradle.kts`의 최소 의존성이다. 프로젝트 골격은 Spring Initializr에서 Boot 4.1.1, Java 25, Gradle Kotlin DSL로 만든다. MySQL과 Redis를 띄운 뒤 Mailpit으로 로컬 메일을 받는다.

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}
java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }
dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    runtimeOnly("com.mysql:mysql-connector-j")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

Maven은 parent `4.1.1`과 같은 starter artifact를 쓴다. Mailpit: `docker run --rm -p 1025:1025 -p 8025:8025 axllent/mailpit`; UI는 `http://localhost:8025`. `src/main/resources/application-local.properties`:

```properties
# 직접 준비한 MySQL 예시(3306·ds_practice). 이 저장소 compose라면 localhost:13308/practice
spring.datasource.url=jdbc:mysql://localhost:3306/ds_practice
spring.datasource.username=app
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.data.redis.host=localhost
spring.mail.host=localhost
spring.mail.port=1025
app.verification.pepper=${VERIFY_CODE_PEPPER}
app.public-base-url=${APP_PUBLIC_BASE_URL}
```

비밀값은 환경변수/비밀관리 시스템에서 공급한다. pepper를 코드나 Git에 넣지 않는다. 실행은 `./gradlew bootRun --args='--spring.profiles.active=local'`; Maven은 `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`이다.

### 3.2 스키마 변경

`src/main/resources/db/migration/V2__account_lifecycle.sql` 예시다. 기존 제약 이름은 연습 스키마 기준이다. 운영 DB는 먼저 현재 값·제약을 확인하고 무중단 변경 순서를 잡는다.

```sql
ALTER TABLE member DROP CHECK ck_member_status;
ALTER TABLE member MODIFY member_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE member ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN email_verified_at DATETIME(6) NULL,
  ADD COLUMN phone_verified_at DATETIME(6) NULL,
  ADD COLUMN credential_version INT NOT NULL DEFAULT 0,
  ADD CONSTRAINT ck_member_status CHECK
    (member_status IN ('PENDING','ACTIVE','SUSPENDED','WITHDRAWN'));

CREATE TABLE verification_challenge (
  id BINARY(16) PRIMARY KEY, member_id BIGINT NOT NULL,
  purpose VARCHAR(24) NOT NULL, channel VARCHAR(8) NOT NULL,
  code_mac CHAR(64) NOT NULL, pepper_version SMALLINT NOT NULL,
  expires_at DATETIME(6) NOT NULL, attempts SMALLINT NOT NULL DEFAULT 0,
  consumed_at DATETIME(6) NULL, created_at DATETIME(6) NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member(id),
  CHECK (purpose IN ('SIGNUP','PHONE_CONFIRM')),
  CHECK (channel IN ('EMAIL','SMS')),
  KEY ix_vc_latest (member_id,purpose,channel,created_at)
);
CREATE TABLE password_reset_token (
  id BINARY(16) PRIMARY KEY, member_id BIGINT NOT NULL,
  token_hash BINARY(32) NOT NULL UNIQUE, expires_at DATETIME(6) NOT NULL,
  used_at DATETIME(6) NULL, created_at DATETIME(6) NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member(id),
  KEY ix_prt_member (member_id,created_at), KEY ix_prt_expiry (expires_at)
);
```

신규 가입은 `PENDING`을 명시한다. `password_hash`를 채운 뒤 `NOT NULL`로 전환한다. 인증 성공은 미사용·미만료·한도 미초과 조건의 challenge만 소비하고 회원을 갱신한다. DB는 감사가 쉽지만 만료 행 정리가 필요하고, Redis는 TTL이 편하지만 운영 복구 설계를 따로 둔다. 양쪽 모두 원문 코드는 저장하지 않는다.

로컬은 `mysql -u app -p ds_practice < src/main/resources/db/migration/V2__account_lifecycle.sql`로 스키마를 적용한다. `Clock.systemUTC()`와 `SecureRandom` 빈을 등록한다.

### 3.3 API 계약

| API | 요청 | 성공 | 실패·보안 계약 |
|---|---|---|---|
| `POST /api/registrations` | `loginId,email,phone?,password` | `201`, `PENDING` + 불투명 handle | 이메일 UNIQUE 충돌 `409`; 비밀번호·코드는 응답 금지 |
| `POST /api/verification-codes` | 가입 시 받은 불투명 `registrationHandle,purpose,channel` | `202` | 서버가 연락처를 조회; 쿨다운/일일 한도는 `429` + `Retry-After` |
| `POST /api/verifications` | `challengeId,code` | `204` | 잘못됨/만료/사용됨은 일반화된 오류; 횟수 소진 시 challenge 무효 |
| `POST /api/password-resets` | `email` | 항상 같은 `202`와 “계정이 있다면 안내를 보냈습니다” | 존재하지 않는 주소에도 같은 상태·본문·유사한 시간 |
| `POST /api/password-resets/confirm` | `token,newPassword` | `204` | 토큰 불가/만료/재사용은 동일한 오류; 성공하면 토큰·기존 세션 폐기 |
| 로그인 API | `loginId,password` | `200` 또는 인증 토큰 | 시도 제한은 `429`(IP 정책) 또는 `423`(정책상 잠금); `Retry-After` 포함, 계정 존재는 응답 차이로 드러내지 않기 |

### 3.4 코드 핵심 (미실행)

#### 인증 코드 생성·전송

`src/main/java/example/account/VerificationCodeService.java`. `Clock`과 `SecureRandom`은 주입해 만료와 코드를 테스트에서 통제한다. `VerificationSender`는 메일/SMS 공급자에 대한 경계다.

```java
package example.account;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import org.springframework.stereotype.Service;

interface VerificationSender { void sendEmail(String address, String code); void sendSms(String e164, String code); }
interface VerificationChallengeStore {
    void enforceCooldownAndDailyLimit(long id, String channel, Instant now);
    void replaceActive(long id, String purpose, String channel, String mac, Instant now, Instant expires);
}

@Service
class VerificationCodeService {
    private final SecureRandom random; private final Clock clock;
    private final VerificationChallengeStore store; private final CodeMac codeMac;
    private final VerificationSender sender;
    VerificationCodeService(SecureRandom r, Clock c, VerificationChallengeStore s,
                            CodeMac m, VerificationSender out) {
        random=r; clock=c; store=s; codeMac=m; sender=out;
    }
    void issue(long memberId, String purpose, String channel, String target) {
        Instant now=clock.instant(); store.enforceCooldownAndDailyLimit(memberId,channel,now);
        String code=String.format(Locale.ROOT,"%06d",random.nextInt(1_000_000));
        store.replaceActive(memberId,purpose,channel,codeMac.mac(code),now,now.plus(Duration.ofMinutes(5)));
        if (channel.equals("EMAIL")) sender.sendEmail(target,code); else sender.sendSms(target,code);
    }
}
```

`VerificationChallengeStore`의 DB 구현은 이전 코드 무효화와 새 행 삽입을 한 트랜잭션으로 한다. 메일·SMS는 별도 어댑터로 보내고 공급자 실패 재시도는 outbox로 처리한다. 공개 API에는 `memberId` 대신 가입 때 발급한 짧은 수명의 불투명 handle을 받는다. 수신 주소는 서버가 조회한다.

HMAC 키는 환경변수에서 읽고 충분한 난수로 만든다.

```java
package example.account;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Component
public class CodeMac {
    private final byte[] key;
    public CodeMac(@Value("${app.verification.pepper}") String pepper) { key=pepper.getBytes(StandardCharsets.UTF_8); }
    public String mac(String code) {
        try {
            Mac mac=Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(key,"HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(code.getBytes(StandardCharsets.US_ASCII)));
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException("HMAC-SHA-256 unavailable", e);
        }
    }
}
```

검증은 입력 MAC을 상수시간 비교하고, 실패 횟수는 원자적으로 올린다. 주입 `Clock`으로 만료를 확인한 뒤 조건부 UPDATE 영향 행이 1인 요청만 성공시켜 재사용·경합을 막는다.

Redis 대안은 `verification:{challengeId}`에 MAC을 `SET ... EX 300 NX`, 쿨다운은 `SET cooldown:{targetDigest} 1 NX EX 60`으로 둔다. 코드 원문은 메시지 발송 때만 메모리에 둔다. 이메일은 일관되게 정규화하고 전화번호는 E.164로 저장한다.

#### 비밀번호 재설정

토큰은 CSPRNG 32바이트로 만들고 DB에는 `SHA-256(rawToken)`만 둔다. 256비트 무작위 값은 빠른 해시로 역산하기 어렵다. URL·프록시 로그·분석 도구·Referer에 토큰이 남지 않게 하고 리셋 페이지의 제3자 리소스를 제한한다.

```java
byte[] bytes = new byte[32];
secureRandom.nextBytes(bytes);
String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
byte[] digest = MessageDigest.getInstance("SHA-256")
        .digest(rawToken.getBytes(StandardCharsets.US_ASCII));
resetStore.replacePrevious(memberId, digest, clock.instant().plus(Duration.ofMinutes(15)));
mailer.sendResetLink(verifiedAddress, rawToken); // rawToken은 URL 조립 직후 폐기, 로그 금지
```

링크 host는 요청 `Host`/`X-Forwarded-Host`가 아니라 `app.public-base-url`에서 만든다. 토큰 소비는 `used_at IS NULL AND expires_at>?` 조건부 UPDATE로 한 건만 성공시킨다. 같은 트랜잭션에서 `PasswordEncoder` 해시 저장, refresh token 폐기(또는 `credential_version` 증가), 나머지 reset token 폐기, 감사 이벤트 기록을 한다.

운영용 `{noop}`/`User.withDefaultPasswordEncoder()` 대신 `PasswordEncoderFactories.createDelegatingPasswordEncoder()`를 빈으로 둔다. `matches`로 비교하고 BCrypt/Argon2 비용은 서비스 용량에 맞춰 측정한다. 없는 주소에도 같은 `202`를 반환하며 발송을 비동기화해 시간 차이를 줄인다.

#### 로그인 시도 제한과 Security 연결

IP와 계정 키를 HMAC 처리해 Redis 키에 원문 식별자가 남지 않게 한다. 다음 스크립트는 카운터 증가와 첫 만료 설정을 Redis 안에서 함께 수행한다. Spring Data Redis의 `StringRedisTemplate.execute`를 사용한다.

```java
private static final DefaultRedisScript<Long> INCR_WINDOW =
    new DefaultRedisScript<>("""
        local n = redis.call('INCR', KEYS[1])
        if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
        return n
        """, Long.class);

long failed(String opaqueKey, Duration window) {
    Long n = redis.execute(INCR_WINDOW, List.of(opaqueKey),
            Long.toString(window.toSeconds()));
    if (n == null) throw new IllegalStateException("rate counter unavailable");
    return n;
}
```

인증 전에 계정/IP 제한을 검사하고 실패 핸들러에서 카운터를 올려 `429`/`423`과 `Retry-After`를 보낸다. 성공 핸들러는 카운터를 초기화한다. `AuthenticationFailureEvent`/`AuthenticationSuccessEvent`는 감사용이며 HTTP 응답은 핸들러에서 만든다. 계정 미존재도 같은 방식으로 센다. Redis 장애 시 제한 우회 허용 여부를 정책으로 정한다.

**확인 방법(예제, 미실행):** `curl -i -H 'Content-Type: application/json' -d '{"loginId":"a1","email":"a@example.com","password":"Strong-demo-password-123!"}' localhost:8080/api/registrations`는 `201/PENDING`, 재요청은 `409`여야 한다. Mailpit에서 코드 메일을 확인하고 올바른 코드는 한 번만 받아들인다. reset 요청은 존재/미존재 주소 모두 같은 `202`; 초과 로그인은 `429`와 `Retry-After`, 성공 로그인은 카운터 초기화를 확인한다.

**테스트 항목(예시, 미실행):** `Clock.fixed`로 5분 만료를 검증하고 오입력 한도·1회 소비를 확인한다. 동시 이메일 INSERT와 reset 소비는 각각 성공 1건만 남아야 한다. Redis 통합 테스트는 두 서비스의 공유 카운터를 확인한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| 이메일 중복 | 경합 방지 | `UNIQUE(email)` | 정규화 후 저장, 충돌은 `409` |
| 6자리 인증 코드 | 소유 증명 | `SecureRandom.nextInt(1_000_000)` | HMAC 저장, TTL·횟수 제한 |
| 재전송 | 발송 폭주 제어 | `SET cooldown:<digest> 1 NX EX 60` | 주소/IP/일일 한도 함께 적용 |
| reset token | 비밀번호 복구 권한 | 32 random bytes, SHA-256 저장 | 1회 소비, 15분 등 짧은 만료 |
| 비밀번호 해시 | 저장·검증 | `PasswordEncoder.encode/matches` | raw 비밀번호 로그 금지 |
| 분산 시도 제한 | 여러 노드 합산 | Redis `INCR` + 첫 `EXPIRE` Lua | 키에 이메일/IP 원문 금지 |
| 제한 응답 | 클라이언트 대기 안내 | `429`, `Retry-After: 60` | 잠금 차이로 계정 유무 노출 주의 |

## 5. 자주 나는 에러와 해결

1. **`Duplicate entry ... email` →** 가입 INSERT 경합 → `UNIQUE` 유지, `409` 반환.
2. **전 코드도 통과 →** 재전송 때 challenge 잔존 → 새 코드 발급 시 폐기.
3. **만료 코드 통과 →** 앱·DB 시계 불일치 → UTC와 주입 `Clock` 사용.
4. **reset 도메인 변경 →** 요청 `Host` 사용 → 설정된 공개 URL 사용.
5. **Redis 카운터 만료 안 됨 →** TTL 설정 전 중단 → Lua로 증가·TTL 원자화.
6. **로그에 코드 노출 →** 발송 payload 기록 → payload 로깅 금지.

## 6. 한 단계 더

짧은 코드는 HMAC·횟수 제한.  
reset token은 URL 로그에서 보호한다.  
조건부 UPDATE·UNIQUE·Redis Lua로 동시성을 보장한다.  
CAPTCHA·2단계 인증은 위험 기반으로 둔다.  
세션/JWT → S12·S13, 검증 → W10, SMTP → P26, Redis → P23, 비밀번호 → D11.

## 7. 자가점검 Q&A (면접 대비)

**Q1. 이메일 중복을 사전 조회로 확인했는데도 유니크 제약이 필요한 이유는?**  
사전 조회와 INSERT 사이에 다른 요청이 같은 주소를 넣을 수 있다. DB 유니크 인덱스가 최종 직렬화 지점이므로 충돌은 409로 바꾼다.  
꼬리: **공개해도 되나?** 가입은 409, 복구는 감춘다.

**Q2. 6자리 코드를 SHA-256으로만 저장하면 무엇이 부족한가?**  
백만 후보를 전수 대입하기 쉽다. HMAC 비밀키와 온라인 횟수 제한·만료·소비를 함께 쓴다. 짧은 코드는 해시만으로 강해지지 않는다.  
꼬리: **reset token도 HMAC?** 32바이트 난수는 SHA-256으로 충분하다.

**Q3. 비밀번호 재설정 이메일이 존재하지 않는 주소에도 같은 응답을 주는 이유는?**  
응답 차이와 시간 차이를 이용한 계정 열거를 막는다. 발송 작업을 큐로 분리해 양쪽 처리 시간을 비슷하게 한다.  
꼬리: **404면?** 상태 코드도 같게 맞춘다.

**Q4. reset token을 평문으로 저장하지 않는 이유와 1회 소비 방법은?**  
DB 유출이 곧바로 계정 탈취로 이어지지 않게 digest만 저장한다. 만료·미사용 조건 UPDATE의 영향 행이 1일 때만 변경한다.  
꼬리: **동시 요청이면?** 영향 행 1건만 성공한다.

**Q5. 로그인 실패를 계정 기준으로 세면서도 계정 잠금 DoS를 줄이려면?**  
IP 제한은 분산 공격에 약하고 영구 계정 잠금은 DoS가 된다. 계정별 지연과 IP 제한, 만료 잠금·복구를 조합한다.  
꼬리: **CAPTCHA는 언제?** 실패 누적·위험 점수에 따라 적용한다.

**Q6. 애플리케이션 메모리 대신 Redis가 필요한 시점은?**  
서버가 여러 대면 로컬 카운터를 공유할 수 없다. `INCR`와 최초 `EXPIRE`를 Lua로 묶고 장애 시 동작을 정한다.  
꼬리: **이메일 키는?** HMAC digest와 TTL을 쓴다.

## 8. 참고문헌

- OWASP Forgot Password — https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html — reset 지침.
- OWASP Authentication — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html — 로그인 방어.
- Spring Security password auth — https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/index.html — 인증 API.
- Spring Security events — https://docs.spring.io/spring-security/reference/servlet/authentication/events.html — 이벤트 API.
- Spring Boot coordinates — https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html — 관리 버전.
- Redis `INCR` command — https://redis.io/docs/latest/commands/incr/ — 원자 증가.
