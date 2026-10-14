# 10-3. 회원 가입 — BCrypt 해시와 이메일 중복 409

## 상황

명세서의 첫 API다.

| API | 요청 | 성공 | 실패 |
|---|---|---|---|
| `POST /api/v1/users` 가입 | `{email, password(8~64자, UTF-8 72바이트 이하), nickname(2~20자)}` | 201 `{id, email, nickname}` | 400, 409 |

처음으로 **입력을 받아 DB에 쓰는** API다. 네 가지를 지킨다.

1. **비밀번호는 원문으로 저장하지 않는다.** DB가 새도 원래 비밀번호를 알 수 없게 BCrypt 해시만 저장한다. 로그인(10-4)은 해시끼리 비교한다.
2. **같은 이메일로 두 번 가입하지 못한다** → 409 `DUPLICATE`. `Kim@Example.com`과 `kim@example.com`은 같은 주소로 본다. 받은 이메일은 앞뒤 공백을 떼고 소문자로 바꿔 저장한다.
3. **입력이 틀리면 10-2의 400 틀로 답한다** → 필드별 `errors`.
4. **비밀번호는 글자 수와 바이트 수를 둘 다 본다.** 8~64자이면서 UTF-8로 72바이트 이하. BCrypt는 72바이트를 넘는 입력을 해시하지 못하고 예외를 던진다.
  글자 수만 보면 한글 25자(75바이트)가 검증을 통과해 `500`이 된다. 넘으면 400 `VALIDATION_FAILED`(`field`: `password`)로 막는다. 왜 72바이트인지는 [F4](../../lessons/F4-password-storage.md)에 있다.

엔티티·저장소·서비스·컨트롤러를 한 번에 만든다. 계층을 나누는 이유는 [E1](../../lessons/E1-why-layers.md), JPA가 무엇인지는 [E3](../../lessons/E3-what-is-jpa.md)에 있다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "회원 가입 화면",
  "summary": "이메일·비밀번호·닉네임을 넣고 가입한다. 서버는 비밀번호를 해시로 바꿔 저장하고, 이미 있는 이메일이면 409로 막는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "회원 가입" },
    { "type": "field", "id": "email", "label": "이메일", "value": "check-10-3@example.com" },
    { "type": "field", "id": "password", "label": "비밀번호", "value": "••••••••••••" },
    { "type": "field", "id": "nickname", "label": "닉네임", "value": "채점용" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "submit", "label": "가입", "variant": "primary" }] },
    { "type": "toast", "id": "toast", "value": "가입했어요" }
  ],
  "flows": [
    {
      "name": "가입 성공",
      "steps": [
        { "kind": "user", "text": "세 칸을 채우고 [가입]을 누른다", "focus": ["email", "password", "nickname", "submit"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/users", "headers": ["Content-Type: application/json"], "body": "{\n  \"email\": \"check-10-3@example.com\",\n  \"password\": \"password1234\",\n  \"nickname\": \"채점용\"\n}" },
        { "kind": "server", "text": "@Valid가 길이·형식을 검사 → UserService가 이메일 중복을 확인 → passwordEncoder.encode로 해시" },
        { "kind": "db", "sql": "SELECT ... FROM users WHERE email = 'check-10-3@example.com';\nINSERT INTO users (email, password_hash, nickname, created_at)\nVALUES ('check-10-3@example.com', '$2a$10$...', '채점용', NOW());" },
        { "kind": "response", "status": 201, "headers": ["Location: /api/v1/users/4", "Content-Type: application/json"], "body": "{\n  \"status\": 201,\n  \"message\": \"Created\",\n  \"data\": { \"id\": 4, \"email\": \"check-10-3@example.com\", \"nickname\": \"채점용\" }\n}" },
        { "kind": "screen", "text": "가입 완료 — 응답 어디에도 비밀번호가 없다", "focus": ["toast"] }
      ]
    },
    {
      "name": "이미 있는 이메일",
      "steps": [
        { "kind": "user", "text": "같은 이메일을 대문자로 바꿔 다시 가입한다", "focus": ["email", "submit"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/users", "headers": ["Content-Type: application/json"], "body": "{\n  \"email\": \" Check-10-3@Example.COM \",\n  \"password\": \"password1234\",\n  \"nickname\": \"채점용\"\n}" },
        { "kind": "server", "text": "요청 record가 이메일을 다듬는다(공백 제거·소문자) → 이미 있어 ApiException(DUPLICATE)" },
        { "kind": "response", "status": 409, "body": "{\n  \"status\": 409,\n  \"message\": \"이미 가입된 이메일입니다.\",\n  \"code\": \"DUPLICATE\",\n  \"errors\": [],\n  \"data\": null\n}" },
        { "kind": "screen", "text": "이메일 칸 아래에 \"이미 가입된 이메일입니다.\"", "focus": ["email"] }
      ]
    },
    {
      "name": "입력이 틀렸을 때",
      "steps": [
        { "kind": "user", "text": "이메일 형식이 아니고, 비밀번호·닉네임이 짧다", "focus": ["email", "password", "nickname"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/users", "headers": ["Content-Type: application/json"], "body": "{\"email\":\"not-an-email\",\"password\":\"short\",\"nickname\":\"a\"}" },
        { "kind": "server", "text": "@Valid 실패 → MethodArgumentNotValidException → 전역 처리기가 필드별 errors로" },
        { "kind": "response", "status": 400, "body": "{\n  \"status\": 400,\n  \"code\": \"VALIDATION_FAILED\",\n  \"errors\": [\n    { \"field\": \"email\", \"reason\": \"이메일 형식이 아닙니다.\" },\n    { \"field\": \"nickname\", \"reason\": \"닉네임은 2자 이상 20자 이하여야 합니다.\" },\n    { \"field\": \"password\", \"reason\": \"비밀번호는 8자 이상 64자 이하여야 합니다.\" }\n  ],\n  \"data\": null\n}" },
        { "kind": "screen", "text": "칸마다 errors의 reason을 붙인다", "focus": ["email", "password", "nickname"] }
      ]
    },
    {
      "name": "한글 비밀번호가 72바이트를 넘을 때",
      "steps": [
        { "kind": "user", "text": "비밀번호에 한글 25자를 넣고 [가입] — 64자 안이라 글자 수로는 문제없어 보인다", "focus": ["password", "submit"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/users", "headers": ["Content-Type: application/json"], "body": "{\n  \"email\": \"check-10-3-long@example.com\",\n  \"password\": \"가가가가가가가가가가가가가가가가가가가가가가가가가\",\n  \"nickname\": \"채점용\"\n}" },
        { "kind": "server", "text": "@Valid — @Size(8~64자)는 통과, @MaxBytes(72)가 UTF-8 75바이트라 실패. encode까지 가지 않는다" },
        { "kind": "response", "status": 400, "body": "{\n  \"status\": 400,\n  \"code\": \"VALIDATION_FAILED\",\n  \"errors\": [\n    { \"field\": \"password\", \"reason\": \"비밀번호는 72바이트 이하여야 합니다(한글은 한 글자에 3바이트).\" }\n  ],\n  \"data\": null\n}" },
        { "kind": "screen", "text": "비밀번호 칸 아래에 reason — 한글은 24자(72바이트)까지 된다", "focus": ["password"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 의존성 | `spring-security-crypto` 하나만 추가한다(Spring Security 전체가 아니다 — 로그인 필터·기본 로그인 페이지가 딸려 오지 않는다) |
| 메서드·경로 | `POST /api/v1/users` |
| 요청 | `email`: 필수, 이메일 형식, 255자 이하 · `password`: 필수, 8~64자 **그리고** UTF-8 72바이트 이하(한글 24자까지) · `nickname`: 필수, 2~20자(앞뒤 공백 제거 후). 이메일은 앞뒤 공백 제거 + 소문자로 다듬은 뒤 검사·저장 |
| 저장 | `users`에 `password_hash` = BCrypt 해시 |
| 성공 | `201`, 헤더 `Location: /api/v1/users/{id}`, `data` = `{id, email, nickname}` — 비밀번호·해시는 싣지 않는다 |
| 실패 | 입력 규칙 위반 400 `VALIDATION_FAILED`(필드별 `errors`) · 깨진 JSON 400 `BAD_JSON` · 이메일 중복 409 `DUPLICATE` |

**필드 규칙** — 다듬은 뒤 검사한다. 잘못된 입력은 저장 전에 막고 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `email` | 필수 | 안 됨 — 없음·`null`·`""`·공백만 거절 | 앞뒤 공백 제거·소문자 뒤 255자 이하 | 이메일 형식 | 없음 | `400 VALIDATION_FAILED`, `errors`에 `email` · 이미 있으면 `409 DUPLICATE` |
| `password` | 필수 | `null`·`""` 거절(공백은 다듬지 않는다 — 아래 관찰 O1) | 8~64자(8자·64자 성공, 7자·65자 거절) **그리고** UTF-8 72바이트 이하(한글 24자 성공, 25자 거절) | 문자열 | 없음 | `400`, `errors`에 `password` |
| `nickname` | 필수 | 안 됨 — 없음·`null`·`""`·공백만 거절 | 앞뒤 공백 제거 뒤 2~20자(2자·20자 성공, 1자·21자 거절) | 문자열 | 없음 | `400`, `errors`에 `nickname` |
| 본문 전체 | 필수 | — | — | JSON, 각 값은 문자열 | — | JSON이 아니거나 문자열 자리에 배열이면 `400 BAD_JSON` |

## 따라 치기

### build.gradle — 한 줄 추가

```groovy
    // 10-3 비밀번호 해시(BCrypt) — Spring Security 전체가 아니라 암호화 모듈만
    implementation 'org.springframework.security:spring-security-crypto'
```

`dependencies { }` 안에 넣고 Gradle 새로고침을 누른다. 버전은 Boot BOM이 정한다.

### PasswordConfig — 해시 도구를 빈으로

`src/main/java/org/example/board/user/PasswordConfig.java`

```java
package org.example.board.user;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

    // 같은 비밀번호도 매번 다른 해시가 나온다(솔트). 비교는 matches()로만 한다
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

| 코드 | 설명 |
|---|---|
| `@Configuration` + `@Bean` | 메서드가 돌려준 객체를 Spring이 **빈**(앱 전체가 함께 쓰는 객체)으로 등록한다. 생성자에 `PasswordEncoder`를 적은 곳에 이 객체가 들어간다 |
| `return new BCryptPasswordEncoder();` | 반환 타입은 인터페이스 `PasswordEncoder`, 실제는 BCrypt 구현이다. 나중에 알고리즘을 바꿔도 쓰는 쪽은 그대로다([B5](../../lessons/B5-interfaces.md)) |

### User — 엔티티

`src/main/java/org/example/board/user/User.java`

```java
package org.example.board.user;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 20)
    private String nickname;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // JPA가 DB 행을 객체로 만들 때 쓰는 기본 생성자 — 우리 코드는 아래 생성자만 쓴다
    protected User() {
    }

    public User(String email, String passwordHash, String nickname) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.createdAt = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getNickname() {
        return nickname;
    }
}
```

| 코드 | 설명 |
|---|---|
| `@Entity` · `@Table(name = "users")` | 이 클래스 = `users` 테이블의 한 행. 클래스 이름과 테이블 이름이 달라 `@Table`로 적었다 |
| `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` | 기본 키. 값은 DB의 `AUTO_INCREMENT`가 정한다. 그래서 `save` 하는 순간 INSERT가 나가고 id가 채워진다 |
| `@Column(name = "password_hash", nullable = false)` | 필드 이름(`passwordHash`)과 컬럼 이름이 달라 적었다 |
| `protected User() { }` | JPA가 DB 행을 객체로 만들 때 쓰는 빈 생성자. 우리 코드는 못 쓰게 `protected`로 둔다 |
| `LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS)` | 컬럼이 초 단위(`DATETIME`)라 초 아래를 버린다 |
| setter 없음 | 만든 뒤 바꿀 일이 없는 값은 setter를 만들지 않는다 |

`ddl-auto: validate`라 이 클래스가 테이블과 다르면(컬럼 이름 오타 등) 앱이 뜨지 않는다. 그 에러가 오히려 안전장치다.

### UserRepository

`src/main/java/org/example/board/user/UserRepository.java`

```java
package org.example.board.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);
}
```

인터페이스만 만들면 구현은 Spring Data JPA가 만든다. `existsByEmail`·`findByEmail`은 **메서드 이름이 곧 쿼리**다(`... WHERE email = ?`). `findByEmail`은 10-4 로그인에서 쓴다.

### MaxBytes — 바이트 수를 보는 검증 어노테이션

`@Size`는 **글자 수**만 센다. BCrypt의 한계는 **바이트**(72)다. UTF-8에서 영문·숫자는 1바이트, 한글은 3바이트라 한글 25자는 25글자지만 75바이트다. 그래서 바이트를 세는 검증을 하나 만든다.

서비스에서 `if`로 검사하지 않고 어노테이션으로 만드는 이유: 그러면 다른 입력 오류와 함께 `@Valid` 단계에서 `errors`(`field`: `password`)로 나온다. 서비스에서 던지는 `ApiException`에는 필드를 실을 자리가 없어 10-2의 공통 코드까지 고쳐야 한다.

`src/main/java/org/example/board/user/MaxBytes.java`

```java
package org.example.board.user;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.nio.charset.StandardCharsets;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

// 글자 수가 아니라 UTF-8 바이트 수로 길이를 막는다 — BCrypt는 72바이트를 넘는 입력을 encode하지 못한다(F4)
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MaxBytes.Validator.class)
public @interface MaxBytes {

    int value();

    String message();

    // 아래 두 줄은 Bean Validation 규칙상 모든 검증 어노테이션에 있어야 한다
    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    // 실제 검사 — true면 통과
    class Validator implements ConstraintValidator<MaxBytes, String> {

        private int max;

        @Override
        public void initialize(MaxBytes annotation) {
            this.max = annotation.value();
        }

        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            // null은 @NotNull 몫이라 여기서는 통과시킨다
            return value == null || value.getBytes(StandardCharsets.UTF_8).length <= max;
        }
    }
}
```

| 코드 | 설명 |
|---|---|
| `public @interface MaxBytes` | 어노테이션을 직접 만든다. `@MaxBytes(value = 72, message = "…")`처럼 쓴다 |
| `@Target(ElementType.FIELD)` · `@Retention(RetentionPolicy.RUNTIME)` | 필드(record의 각 항목)에 붙이고, 실행 중에도 남아 있어야 검증기가 읽는다 |
| `@Constraint(validatedBy = MaxBytes.Validator.class)` | "이 어노테이션은 이 클래스가 검사한다"를 검증 엔진에 알린다 |
| `groups()` · `payload()` | 쓰지 않지만 빠지면 앱은 뜨는데 가입 요청마다 `500`이다(로그: `HV000074: ... does not contain a groups parameter`). 그대로 따라 적는다 |
| `value.getBytes(StandardCharsets.UTF_8).length <= max` | 문자열을 UTF-8 바이트 배열로 바꿔 길이를 잰다. `"가".getBytes(UTF_8).length`는 3 |
| `value == null \|\| …` | `null`은 통과 — 비어 있음은 `@NotNull`이 따로 잡는다(`@Email`과 같은 약속) |

### SignupRequest — 요청 + 검증 + 다듬기

`src/main/java/org/example/board/user/SignupRequest.java`

```java
package org.example.board.user;

import java.util.Locale;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "이메일은 필수입니다.")
        @Email(message = "이메일 형식이 아닙니다.")
        @Size(max = 255, message = "이메일은 255자 이하여야 합니다.")
        String email,

        @NotNull(message = "비밀번호는 필수입니다.")
        @Size(min = 8, max = 64, message = "비밀번호는 8자 이상 64자 이하여야 합니다.")
        @MaxBytes(value = 72, message = "비밀번호는 72바이트 이하여야 합니다(한글은 한 글자에 3바이트).")
        String password,

        @NotBlank(message = "닉네임은 필수입니다.")
        @Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다.")
        String nickname) {

    // 검증 전에 다듬는다 — 이메일은 앞뒤 공백을 떼고 소문자로(같은 주소를 두 번 가입하지 못하게), 닉네임은 앞뒤 공백만
    public SignupRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
        nickname = nickname == null ? null : nickname.strip();
    }
}
```

| 코드 | 설명 |
|---|---|
| `@NotBlank(message = "…")` | `null`·빈 문자열·공백만인 문자열을 막는다. `message`가 그대로 `errors[].reason`이 된다 |
| `@Email` | 이메일 형식 검사. `null`은 통과시키므로(다른 애노테이션 몫) `@NotBlank`와 같이 쓴다 |
| `@NotNull` + `@Size(min = 8, max = 64)` | 비밀번호는 공백도 글자로 인정해 `@NotBlank` 대신 `@NotNull`을 썼다 |
| `@MaxBytes(value = 72, …)` | 위에서 만든 바이트 검사. `@Size`와 둘 다 붙인다 — 한글 65자면 `password` 오류가 두 개 나온다 |
| `public SignupRequest { … }` | record의 **압축 생성자**. JSON → 객체로 바뀔 때 실행되고, `@Valid` 검사는 그다음이다. 그래서 다듬은 값으로 검사한다 |
| `email.strip().toLowerCase(Locale.ROOT)` | `strip()`은 앞뒤 공백 제거, `Locale.ROOT`는 실행하는 컴퓨터의 언어 설정에 따라 대소문자 변환이 달라지지 않게 고정한다 |

### UserResponse

`src/main/java/org/example/board/user/UserResponse.java`

```java
package org.example.board.user;

// 응답에는 비밀번호(해시 포함)를 절대 싣지 않는다
public record UserResponse(Long id, String email, String nickname) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getNickname());
    }
}
```

엔티티(`User`)를 그대로 JSON으로 내보내면 `passwordHash`까지 나간다. 내보낼 필드만 담는 응답 DTO를 따로 둔다([W09](../../docs/knowledge/W09-why-dto.md)).

### UserService

`src/main/java/org/example/board/user/UserService.java`

```java
package org.example.board.user;

import org.example.board.common.ApiException;
import org.example.board.common.ErrorCode;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(ErrorCode.DUPLICATE, "이미 가입된 이메일입니다.");
        }
        User user = new User(request.email(), passwordEncoder.encode(request.password()), request.nickname());
        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            // 확인과 저장 사이에 같은 이메일이 먼저 들어간 경우 — DB의 UNIQUE가 마지막 방어선이다
            throw new ApiException(ErrorCode.DUPLICATE, "이미 가입된 이메일입니다.");
        }
        return UserResponse.from(user);
    }
}
```

| 코드 | 설명 |
|---|---|
| `@Transactional` | 메서드 전체를 DB 트랜잭션 하나로 묶는다. 중간에 예외가 나면 쓴 것을 되돌린다([G3](../../lessons/G3-first-transaction.md)) |
| `if (userRepository.existsByEmail(...)) throw new ApiException(DUPLICATE, …)` | 먼저 확인해서 친절한 409를 준다 |
| `passwordEncoder.encode(request.password())` | 원문 → `$2a$10$...` 해시. 같은 원문도 매번 다른 해시가 나온다(솔트) |
| `try { save } catch (DataIntegrityViolationException e)` | 확인과 저장 사이에 같은 이메일이 먼저 들어가는 경우(동시 가입)는 DB의 `UNIQUE`가 막는다. 그 예외도 409로 바꾼다 — 단, 아래 망가뜨리기 ①처럼 **다른 제약 위반까지 409로 둔갑**할 수 있으니 검증(`@Valid`)이 먼저 막아야 한다 |

### UserController

`src/main/java/org/example/board/user/UserController.java`

```java
package org.example.board.user;

import java.net.URI;

import jakarta.validation.Valid;
import org.example.board.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/api/v1/users")
    public ResponseEntity<ApiResponse<UserResponse>> signup(@Valid @RequestBody SignupRequest request) {
        UserResponse created = userService.signup(request);
        return ResponseEntity.created(URI.create("/api/v1/users/" + created.id()))
                .body(ApiResponse.created(created));
    }
}
```

| 코드 | 설명 |
|---|---|
| `@Valid @RequestBody SignupRequest request` | 본문 JSON → `SignupRequest` → 검증. 실패하면 메서드에 들어오기 전에 400 |
| `ResponseEntity.created(URI.create("/api/v1/users/" + created.id()))` | 상태 201 + `Location` 헤더 |
| `.body(ApiResponse.created(created))` | 본문은 공통 틀(`status: 201, message: "Created"`) |

`Location`은 "만든 것의 주소"다. 명세서에 `GET /api/v1/users/{id}` API는 없지만, 자원의 주소를 알려 준다는 약속은 지킨다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- @Valid가 길이·형식을 검사 → UserService가 이메일 중복을 확인 → passwordEncoder.encode로 해시
- 요청 record가 이메일을 다듬는다(공백 제거·소문자) → 이미 있어 ApiException(DUPLICATE)
- @Valid 실패 → MethodArgumentNotValidException → 전역 처리기가 필드별 errors로
- @Valid — @Size(8~64자)는 통과, @MaxBytes(72)가 UTF-8 75바이트라 실패. encode까지 가지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`UserController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/v1/users")`. 변경된 메서드: `signup`.

```java
@PostMapping("/api/v1/users")
public ResponseEntity<ApiResponse<UserResponse>> signup(@Valid @RequestBody SignupRequest request) {
    UserResponse created = userService.signup(request);
    return ResponseEntity.created(URI.create("/api/v1/users/" + created.id()))
            .body(ApiResponse.created(created));
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`SignupRequest.java`, `UserResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다. 변경된 메서드: `from`.

```java
public record SignupRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotNull @Size(min = 8, max = 64) @MaxBytes(value = 72, message = "비밀번호는 72바이트 이하여야 합니다(한글은 한 글자에 3바이트).") String password,
        @NotBlank @Size(min = 2, max = 20) String nickname) {
    public SignupRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
        nickname = nickname == null ? null : nickname.strip();
    }
}

public record UserResponse(Long id, String email, String nickname) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getNickname());
    }
}
```

여기는 검증과 다듬기 위치를 보여 주는 발췌다. 오류 문구까지 포함한 실행 가능한 파일 전문은 아래 **전체 구현 코드**의 DTO 접기에 있다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`UserService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `signup`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public UserResponse signup(SignupRequest request) {
    if (userRepository.existsByEmail(request.email())) {
        throw new ApiException(ErrorCode.DUPLICATE, "이미 가입된 이메일입니다.");
    }
    User user = new User(request.email(), passwordEncoder.encode(request.password()), request.nickname());
    try {
        userRepository.save(user);
    } catch (DataIntegrityViolationException e) {
        throw new ApiException(ErrorCode.DUPLICATE, "이미 가입된 이메일입니다.");
    }
    return UserResponse.from(user);
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`UserRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.

```java
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
}
```

`existsByEmail`은 정규화한 이메일을 `users.email`에 대조한다. 동시 요청 사이의 최종 중복 방어선은 V1 마이그레이션의 `UNIQUE(email)`이다.

</details>

<details>
<summary>MyBatis / Mapper — 같은 가입을 SQL로 구현하기</summary>

선택 경로에서는 `UserRepository`와 JPA 엔티티를 빼고 `UserMapper`와 SQL XML을 넣는다. `UserController`·`SignupRequest`·`UserResponse`의 HTTP 계약과 검증은 그대로 쓴다. 아래 **MyBatis 대체 구현 코드** 접기에는 기본 10-3 스냅샷에 적용할 설정·POJO·Service·Mapper 전문이 있다.

```xml
<select id="existsByEmail" resultType="boolean">
    SELECT EXISTS(SELECT 1 FROM users WHERE email = #{email})
</select>
<insert id="insert" parameterType="org.example.board.user.User"
        useGeneratedKeys="true" keyProperty="id">
    INSERT INTO users (email, password_hash, nickname, created_at)
    VALUES (#{email}, #{passwordHash}, #{nickname}, #{createdAt})
</insert>
```

`#{email}`은 문자열을 SQL에 이어 붙이지 않고 바인딩한다. INSERT가 만든 id는 `useGeneratedKeys`로 `User.id`에 채워져 `Location`과 응답 DTO에 쓰인다.

Service에서는 먼저 `existsByEmail`로 확인하고, 그 사이 같은 이메일이 들어오면 DB의 `UNIQUE` 위반을 `DuplicateKeyException`으로 받아 409 `DUPLICATE`로 바꾼다. `@Transactional`과 BCrypt 해시는 JPA 경로와 동일하다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`User.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

```java
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String email;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(nullable = false, length = 20)
    private String nickname;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

테이블에 저장하는 것은 `password` 원문이 아니라 `password_hash`다. 생성자와 접근자까지 포함한 파일 전문은 아래 Entity 접기에서 확인한다.

</details>

<details>
<summary>설정·보조 코드</summary>

`build.gradle`, `MaxBytes.java`, `PasswordConfig.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `initialize`, `passwordEncoder`.

```groovy
implementation 'org.springframework.security:spring-security-crypto'
```

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}

// MaxBytes.Validator의 핵심 검사. null은 @NotNull이 따로 처리한다.
return value == null || value.getBytes(StandardCharsets.UTF_8).length <= max;
```

`MaxBytes`의 `groups()`·`payload()`를 포함한 전체 어노테이션 정의도 아래 설정·보조 코드 접기에 있다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
post() { curl -s -i -X POST "$BASE/api/v1/users" -H 'Content-Type: application/json' "$@"; echo; echo ----; }

post -d '{"email":"check-10-3@example.com","password":"password1234","nickname":"채점용"}'      # A 가입(두 번째부터는 409)
post -d '{"email":"check-10-3@example.com","password":"password1234","nickname":"채점용"}'      # B 같은 이메일
post -d '{"email":" Check-10-3@Example.COM ","password":"password1234","nickname":"채점용"}'    # C 대소문자·공백만 다름
post -d '{"email":"not-an-email","password":"short","nickname":"a"}'                         # V 규칙 위반 셋
post -d '{}'                                                                                 # E 빈 객체
post -d '{"email":'                                                                          # J 깨진 JSON
post -d '{"email":"check-10-3-long@example.com","password":"가가가가가가가가가가가가가가가가가가가가가가가가가","nickname":"채점용"}'  # K 한글 25자(75바이트)

# 잘못된 입력 — 모두 400(500이 아니다)
post -d '{"email":null,"password":null,"nickname":null}'                                   # V1
post -d '{"email":"","password":"","nickname":""}'                                     # V2
post -d '{"email":"check-10-3-v5@example.com","password":"aaaaaaa","nickname":"  둘  "}'  # V5 7자·다듬으면 1자
post -d '{"email":["check-10-3@example.com"],"password":"password1234","nickname":"채점용"}'  # V6 BAD_JSON
post -d '{"email":"check-10-3-b1@example.com","password":"aaaaaaaa","nickname":"  닉네  "}'  # B1 경계 안쪽(처음 201, 다시 409)
```

DB에서 해시를 본다.

```bash
docker compose exec -T mysql mysql -ucommunity -pcommunity project \
  -e "SELECT id, email, LEFT(password_hash, 7) AS head, LENGTH(password_hash) AS len FROM users WHERE email = 'check-10-3@example.com';"
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 요청 A는 처음 실행이면 201, 다시 실행하면 이미 가입돼 있어 409다. 둘 다 통과로 본다.

```check
{
  "requests": [
    { "id": "A", "title": "가입(재실행이면 409)", "method": "POST", "path": "/api/v1/users", "body": { "email": "check-10-3@example.com", "password": "password1234", "nickname": "채점용" } },
    { "id": "B", "title": "같은 이메일", "method": "POST", "path": "/api/v1/users", "body": { "email": "check-10-3@example.com", "password": "password1234", "nickname": "채점용" } },
    { "id": "C", "title": "대소문자·공백만 다른 이메일", "method": "POST", "path": "/api/v1/users", "body": { "email": " Check-10-3@Example.COM ", "password": "password1234", "nickname": "채점용" } },
    { "id": "V", "title": "규칙 위반 셋", "method": "POST", "path": "/api/v1/users", "body": { "email": "not-an-email", "password": "short", "nickname": "a" } },
    { "id": "E", "title": "빈 객체", "method": "POST", "path": "/api/v1/users", "body": {} },
    { "id": "J", "title": "깨진 JSON", "method": "POST", "path": "/api/v1/users", "headers": { "Content-Type": "application/json" }, "body": "{\"email\":" },
    { "id": "K", "title": "한글 25자 비밀번호(75바이트)", "method": "POST", "path": "/api/v1/users", "body": { "email": "check-10-3-long@example.com", "password": "가가가가가가가가가가가가가가가가가가가가가가가가가", "nickname": "채점용" } },
    {"id": "V1", "title": "세 필드 모두 null", "method": "POST", "path": "/api/v1/users", "body": {"email": null, "password": null, "nickname": null}},
    {"id": "V2", "title": "세 필드 모두 빈 문자열", "method": "POST", "path": "/api/v1/users", "body": {"email": "", "password": "", "nickname": ""}},
    {"id": "V3", "title": "이메일 256자", "method": "POST", "path": "/api/v1/users", "body": {"email": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@x.com", "password": "password1234", "nickname": "채점용"}},
    {"id": "V4", "title": "비밀번호 65자·닉네임 21자", "method": "POST", "path": "/api/v1/users", "body": {"email": "check-10-3-v4@example.com", "password": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "nickname": "닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉"}},
    {"id": "V5", "title": "비밀번호 7자·닉네임 다듬으면 1자", "method": "POST", "path": "/api/v1/users", "body": {"email": "check-10-3-v5@example.com", "password": "aaaaaaa", "nickname": "  둘  "}},
    {"id": "V6", "title": "이메일 자리에 배열", "method": "POST", "path": "/api/v1/users", "body": {"email": ["check-10-3@example.com"], "password": "password1234", "nickname": "채점용"}},
    {"id": "B1", "title": "경계 안쪽 — 비밀번호 8자·닉네임 다듬어 2자", "method": "POST", "path": "/api/v1/users", "body": {"email": "check-10-3-b1@example.com", "password": "aaaaaaaa", "nickname": "  닉네  "}},
    {"id": "B2", "title": "경계 안쪽 — 비밀번호 64자·닉네임 20자", "method": "POST", "path": "/api/v1/users", "body": {"email": "check-10-3-b2@example.com", "password": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "nickname": "닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉"}},
    {"id": "O1", "title": "관찰 O1 — 공백 8칸 비밀번호", "method": "POST", "path": "/api/v1/users", "body": {"email": "check-10-3-space@example.com", "password": "        ", "nickname": "공백비번"}}
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "anyOf": [
          {
            "status": 201,
            "headers": { "Location": { "endsWith": "/api/v1/users/{{A.body.data.id}}" } },
            "json": [
              { "path": "$.status", "equals": 201 },
              { "path": "$.data.id", "type": "number" },
              { "path": "$.data.email", "equals": "check-10-3@example.com" },
              { "path": "$.data.nickname", "equals": "채점용" },
              { "path": "$.data.password", "exists": false },
              { "path": "$.data.passwordHash", "exists": false }
            ]
          },
          {
            "status": 409,
            "json": [{ "path": "$.code", "equals": "DUPLICATE" }]
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 409,
        "json": [
          { "path": "$.status", "equals": 409 },
          { "path": "$.code", "equals": "DUPLICATE" },
          { "path": "$.errors", "equals": [] },
          { "path": "$.data", "type": "null" }
        ]
      }
    },
    { "id": "C3", "request": "C", "expect": { "status": 409, "json": [{ "path": "$.code", "equals": "DUPLICATE" }] } },
    {
      "id": "C4",
      "request": "V",
      "expect": {
        "status": 400,
        "json": [
          { "path": "$.code", "equals": "VALIDATION_FAILED" },
          { "path": "$.errors[*].field", "contains": "email" },
          { "path": "$.errors[*].field", "contains": "password" },
          { "path": "$.errors[*].field", "contains": "nickname" },
          { "path": "$.errors[0].reason", "type": "string" },
          { "path": "$.data", "type": "null" }
        ]
      }
    },
    {
      "id": "C5",
      "request": "E",
      "expect": {
        "status": 400,
        "json": [
          { "path": "$.code", "equals": "VALIDATION_FAILED" },
          { "path": "$.errors[*].field", "contains": "email" },
          { "path": "$.errors[*].field", "contains": "password" },
          { "path": "$.errors[*].field", "contains": "nickname" }
        ]
      }
    },
    { "id": "C6", "request": "J", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "BAD_JSON" }, { "path": "$.data", "type": "null" }] } },
    {
      "id": "C7",
      "request": "K",
      "expect": {
        "status": 400,
        "json": [
          { "path": "$.code", "equals": "VALIDATION_FAILED" },
          { "path": "$.errors", "length": 1 },
          { "path": "$.errors[0].field", "equals": "password" },
          { "path": "$.data", "type": "null" }
        ]
      }
    },
    {
      "id": "C8",
      "all": [
        {
          "request": "V1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "email"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "password"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "nickname"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "email"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "password"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "nickname"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "V3",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "email"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V4",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "password"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V4",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "nickname"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V5",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "password"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V5",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "nickname"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V6",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.code",
                "equals": "BAD_JSON"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C10",
      "all": [
        {
          "request": "B1",
          "expect": {
            "anyOf": [
              {
                "status": 201,
                "json": [
                  {
                    "path": "$.data.nickname",
                    "equals": "닉네"
                  }
                ]
              },
              {
                "status": 409,
                "json": [
                  {
                    "path": "$.code",
                    "equals": "DUPLICATE"
                  }
                ]
              }
            ]
          }
        },
        {
          "request": "B2",
          "expect": {
            "anyOf": [
              {
                "status": 201,
                "json": [
                  {
                    "path": "$.data.nickname",
                    "equals": "닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉닉"
                  }
                ]
              },
              {
                "status": 409,
                "json": [
                  {
                    "path": "$.code",
                    "equals": "DUPLICATE"
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C11",
      "manual": "관찰(채점 안 함) — O1 공백 8칸 비밀번호: 정답 코드에서는 처음 실행이면 201로 가입된다(다시 실행하면 409). @NotNull·@Size만 있어 공백만인 비밀번호를 막지 않는다 — 막을지는 정책 결정(@NotBlank를 더하면 400)"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 처음이면 `201`, `Location`이 `/api/v1/users/{id}`로 끝남, `data`에 `id`·`email`(`check-10-3@example.com`)·`nickname`, `password`·`passwordHash` 없음. 이미 가입돼 있으면 `409 DUPLICATE` |
| C2 | 요청 B | `409`, `code`=`DUPLICATE`, `errors`=`[]`, `data`=`null` |
| C3 | 요청 C | `409 DUPLICATE` — 대소문자·앞뒤 공백만 다른 이메일은 같은 이메일 |
| C4 | 요청 V | `400 VALIDATION_FAILED`, `errors`의 `field`에 `email`·`password`·`nickname`이 모두 있고 `reason`은 문자열 |
| C5 | 요청 E | `400 VALIDATION_FAILED`, 세 필드 모두 `errors`에 있음 |
| C6 | 요청 J | `400 BAD_JSON` |
| C7 | 요청 K | `400 VALIDATION_FAILED`, `errors`는 `password` 하나 — 한글 25자는 64자 안이지만 75바이트라 BCrypt 한계(72바이트)를 넘는다. `500`이면 바이트 검사가 없다 |
| C8 | V1 / V2 | 세 필드 모두 `null`, 모두 빈 문자열 → `400 VALIDATION_FAILED`, `errors`에 `email`·`password`·`nickname`이 **모두** 있다 — `500`이 아니다 |
| C9 | V3 / V4 / V5 / V6 | 이메일 256자 `email` / 비밀번호 65자·닉네임 21자 `password`·`nickname` / 비밀번호 7자·닉네임 다듬으면 1자 `password`·`nickname` — 모두 `400 VALIDATION_FAILED` / 이메일 자리에 배열 `400 BAD_JSON` |
| C10 | B1 / B2 | 경계 바로 안쪽은 통과한다 — 비밀번호 8자·닉네임 다듬어 2자(`닉네`), 비밀번호 64자·닉네임 20자 모두 처음이면 `201`, 다시 실행하면 `409 DUPLICATE`(검증은 통과했다는 뜻) |
| C11 | 관찰 O1 — 공백 8칸 비밀번호 | **채점 제외(관찰)** — 결과 줄의 필수 N/M에 세지 않는다. (정답 코드: 처음이면 `201` — 공백만인 비밀번호를 막지 않는다. 정책 결정 사항) |
| D1 | `SELECT LEFT(password_hash, 7), LENGTH(password_hash) FROM users WHERE email = 'check-10-3@example.com'` | `$2a$10$`, `60` — 원문이 아니라 BCrypt 해시 |
| R1 | 응답 | 엔티티를 그대로 반환하지 않고 응답 DTO(`id`·`email`·`nickname`)로 내보낸다 |
| R2 | 해시 | `PasswordEncoder`(BCrypt)를 빈으로 두고 주입받아 쓴다. 해시를 직접 만들거나 비교하지 않는다 |
| R3 | 중복 | 저장 전에 확인하고, 동시 가입은 DB `UNIQUE` 위반을 409로 바꿔 막는다 |
| R4 | 바이트 | 비밀번호의 UTF-8 바이트 수(72 이하)를 `encode` 전에, 검증 단계에서 막는다 — `encode`의 예외를 잡아 바꾸는 게 아니다 |

## 일부러 망가뜨리기

하나씩 바꾸고 다시 띄운 뒤 요청을 보낸다. 끝나면 되돌린다. 모두 Boot 4.1.1에서 재현했다. 망가뜨린 채 만든 회원은 확인 후 `DELETE FROM users WHERE email = '...'`로 지우거나 `docker compose down -v && docker compose up -d`으로 되돌린다.

### ① `@Valid`를 뺀다 → 엉뚱한 409, 엉뚱한 201

컨트롤러의 `@Valid @RequestBody`에서 `@Valid`를 지운다. 닉네임 없이 보낸다.

```bash
post -d '{"email":"novalid@example.com","password":"password1234"}'
```

```text
{"status":409,"message":"이미 가입된 이메일입니다.","code":"DUPLICATE","errors":[],"data":null}
```

로그:

```text
WARN ... org.hibernate.orm.jdbc.error : HHH000247: ErrorCode: 1048, SQLState: 23000
WARN ... org.hibernate.orm.jdbc.error : Column 'nickname' cannot be null
```

- 읽는 법: 검증이 없으니 `nickname`이 `null`인 채 INSERT까지 갔다. DB의 `NOT NULL`이 막았다. 그런데 서비스가 `DataIntegrityViolationException`을 **전부** "이메일 중복"으로 바꾸고 있어서 거짓 409가 나갔다. 응답만 보면 원인을 알 수 없다. 로그의 `WARN` 두 줄이 진짜 원인이다.
- 형식이 틀린 값은 더 나쁘다. `{"email":"not-an-email","password":"x","nickname":"a"}`를 보내면 `201`로 그대로 가입된다.
- 고치기: `@Valid`를 되돌린다. 입력 규칙은 DB 제약이 아니라 **요청 검증이 먼저** 막는다. DB 제약은 마지막 방어선이다.

### ② `PasswordConfig`의 `@Configuration`을 지운다 → 앱이 뜨지 않는다

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

Parameter 1 of constructor in org.example.board.user.UserService required a bean of type 'org.springframework.security.crypto.password.PasswordEncoder' that could not be found.


Action:

Consider defining a bean of type 'org.springframework.security.crypto.password.PasswordEncoder' in your configuration.
```

- 읽는 법: `Parameter 1 of constructor` — `UserService` 생성자의 두 번째 매개변수(0부터 센다)인 `PasswordEncoder`를 넣어 줄 빈이 없다. `@Configuration`이 없으면 Spring이 그 클래스의 `@Bean` 메서드를 보지 않는다.
- 고치기: `@Configuration`을 되돌린다.

### ③ 해시 없이 저장한다 → 에러는 없다

`passwordEncoder.encode(request.password())` 대신 `request.password()`를 그대로 넘긴다. 가입은 아무 문제 없이 `201`이다.

```text
{"status":201,"message":"Created","data":{"id":5,"email":"plain@example.com","nickname":"평문"}}
```

D1 조회에 원문이 그대로 보인다.

```text
LEFT(password_hash, 12)	LENGTH(password_hash)
password1234	12
```

**에러가 안 나는 실수가 가장 위험하다.** D1이 이것을 잡는다. 10-4의 로그인은 `matches(원문, 해시)`로 비교하므로, 이렇게 가입한 계정은 로그인하면 401이고 로그에 경고가 한 줄 남는다(10-4 코드에서 재현).

```text
WARN ... o.s.s.c.bcrypt.BCryptPasswordEncoder : Encoded password does not look like BCrypt
```

### ④ `@MaxBytes`를 뺀다 → 한글 비밀번호가 500

`SignupRequest`에서 `@MaxBytes(...)` 줄을 지우고(글자 수 `@Size`만 남는다) 요청 K를 보낸다.

```text
{"status":500,"message":"서버 오류가 발생했습니다.","code":"INTERNAL_ERROR","errors":[],"data":null}
```

로그:

```text
ERROR ... o.e.board.common.GlobalExceptionHandler  : 처리하지 못한 예외

java.lang.IllegalArgumentException: password cannot be more than 72 bytes
	at org.springframework.security.crypto.bcrypt.BCrypt.hashpw(BCrypt.java:616) ~[spring-security-crypto-7.1.1.jar!/:7.1.1]
	...
	at org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder.encodeNonNullPassword(BCryptPasswordEncoder.java:109) ~[spring-security-crypto-7.1.1.jar!/:7.1.1]
	...
	at org.example.board.user.UserService.signup(UserService.java:26) ~[!/:0.0.1-SNAPSHOT]
```

- 읽는 법: 한글 25자는 `@Size(max = 64)`를 통과했다. 그다음 `passwordEncoder.encode`가 75바이트를 받고 예외를 던졌다. 전역 처리기의 마지막 갈래(`Exception`)가 잡아 `500`이 됐다. 같은 조건에서 한글 24자(72바이트)는 `201`이다.
- 사용자 잘못(너무 긴 입력)인데 서버 오류로 답했다. `500`은 "서버를 고쳐야 한다"는 뜻이라 화면은 무엇을 고치라고 안내할 수도 없다.
- 고치기: `@MaxBytes`를 되돌린다. `encode`의 예외를 `try`로 잡아 400으로 바꾸지 않는다 — 규칙은 검증이 먼저 막는다(①과 같은 원칙).

## 필요한 지식

- [E1 계층을 나누는 이유](../../lessons/E1-why-layers.md) — 컨트롤러·서비스·저장소
- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md) — 엔티티↔테이블, 저장소 인터페이스
- [F1 검증과 에러 응답](../../lessons/F1-validation-errors.md) — `@Valid`와 400
- [B4 record·getter·불변](../../lessons/B4-record-getter-immutable.md) — 압축 생성자
- [G3 트랜잭션 첫 만남](../../lessons/G3-first-transaction.md)
- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md)
- [D11 웹 보안 기초](../../docs/knowledge/D11-web-security-basics.md) — 비밀번호는 왜 해시로
- [F4 비밀번호 저장](../../lessons/F4-password-storage.md) — BCrypt의 72바이트 한계(가입 `encode`는 예외, 로그인 `matches`는 앞 72바이트만 비교)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 앱이 Schema-validation 에러로 뜨지 않는다</summary>

`Schema-validation: missing column [...]`이나 `wrong column type`이면 엔티티의 `@Column(name = ...)`이 V1의 컬럼 이름과 다르다. `users` 테이블은 `password_hash`·`created_at`처럼 밑줄 이름이다.
</details>

<details>
<summary>힌트 2 — 대문자 이메일이 409가 아니라 201이다</summary>

이메일을 다듬지 않고 그대로 저장했다. record에 압축 생성자 `public SignupRequest { email = ...; }`를 두고 `strip()`·`toLowerCase(Locale.ROOT)`를 한다. 서비스에서 해도 되지만 그러면 `@Email` 검사는 다듬기 전 값으로 한다.
</details>

<details>
<summary>힌트 3 — errors에 필드가 하나만 나온다</summary>

검증은 모든 필드를 한꺼번에 본다. 하나만 나오면 처리기가 `getFieldError()`(첫 번째 하나)를 썼다. `getFieldErrors()`(목록)를 쓴다.
</details>

## 다음 단계

[10-4. 로그인과 JWT](10-4-login-jwt.md) — 가입한 이메일·비밀번호로 로그인해 토큰을 받고, 그 토큰으로 "내 정보"를 본다.
