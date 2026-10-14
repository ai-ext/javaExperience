# 10-4. 로그인과 JWT — 인터셉터와 @LoginUser, 내 정보

## 상황

이제부터 글쓰기·수정·댓글은 "누가" 하는지 알아야 한다. 명세서는 이렇게 정했다.

| API | 요청 | 성공 | 실패 |
|---|---|---|---|
| `POST /api/v1/auth/login` | `{email, password}` | 200 `{accessToken, expiresIn}` | 400, 401(이메일이 없든 비밀번호가 틀리든 같은 응답) |
| `GET /api/v1/users/me` | 토큰 | 200 `{id, email, nickname}` | 401 |

- 토큰은 **JWT**다. HS256 서명, 유효 1시간, 비밀키는 설정 `app.jwt.secret`, 페이로드의 `sub`가 회원 id다.
- 요청은 `Authorization: Bearer <토큰>` 헤더로 토큰을 싣는다.

1-6에서는 DB의 토큰 표를 찾아 확인했다. 이번에는 **서버가 토큰을 저장하지 않는다.** JWT는 서버가 비밀키로 서명한 문자열이다. 서명이 맞으면 서버가 발급한 것이고, 그 안의 `sub`를 믿는다. 토큰 확인은 1-6과 같은 방식으로 한다. **인터셉터**가 한곳에서 확인하고, 컨트롤러는 `@LoginUser Long userId` 매개변수로 회원 id를 받는다.

실무에서는 이 일을 보통 Spring Security가 한다. 이 단계는 그 안에서 일어나는 일(헤더 읽기 → 서명 확인 → 회원 id 꺼내기 → 401)을 직접 만들어 보는 것이다. Security로 옮기는 법은 "더 깊이"에 있다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "로그인 → 내 정보",
  "summary": "로그인하면 토큰을 받아 저장하고, 이후 요청마다 Authorization 헤더에 싣는다. 서버는 서명으로 진짜인지 확인한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "로그인" },
    { "type": "field", "id": "email", "label": "이메일", "value": "kim@example.com" },
    { "type": "field", "id": "password", "label": "비밀번호", "value": "••••••••••••" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "login", "label": "로그인", "variant": "primary" }, { "id": "me", "label": "내 정보", "variant": "secondary" }] },
    { "type": "text", "id": "profile", "value": "김자바 (kim@example.com)", "emphasis": "title" },
    { "type": "toast", "id": "toast", "value": "다시 로그인해 주세요", "tone": "error" }
  ],
  "flows": [
    {
      "name": "로그인",
      "steps": [
        { "kind": "user", "text": "이메일·비밀번호를 넣고 [로그인]", "focus": ["email", "password", "login"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/auth/login", "headers": ["Content-Type: application/json"], "body": "{\n  \"email\": \"kim@example.com\",\n  \"password\": \"password1234\"\n}" },
        { "kind": "db", "sql": "SELECT * FROM users WHERE email = 'kim@example.com';", "note": "있으면 passwordEncoder.matches(원문, password_hash)" },
        { "kind": "server", "text": "JwtProvider가 sub=1, exp=지금+1시간으로 서명한 토큰을 만든다" },
        { "kind": "response", "status": 200, "body": "{\n  \"status\": 200,\n  \"message\": \"OK\",\n  \"data\": { \"accessToken\": \"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIi...\", \"expiresIn\": 3600 }\n}" },
        { "kind": "screen", "text": "프론트가 accessToken을 저장한다(메모리·저장소)", "focus": ["bar"] }
      ]
    },
    {
      "name": "내 정보",
      "steps": [
        { "kind": "user", "text": "[내 정보]를 누른다", "focus": ["me"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/users/me", "headers": ["Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."] },
        { "kind": "server", "text": "AuthInterceptor: Bearer 떼기 → 서명·만료 확인 → sub=1을 요청 속성에 → @LoginUser Long userId = 1" },
        { "kind": "db", "sql": "SELECT * FROM users WHERE id = 1;" },
        { "kind": "response", "status": 200, "body": "{\n  \"status\": 200,\n  \"message\": \"OK\",\n  \"data\": { \"id\": 1, \"email\": \"kim@example.com\", \"nickname\": \"김자바\" }\n}" },
        { "kind": "screen", "text": "내 닉네임과 이메일이 보인다", "focus": ["profile"] }
      ]
    },
    {
      "name": "토큰이 만료됐을 때",
      "steps": [
        { "kind": "user", "text": "한 시간 넘게 지나 [내 정보]를 누른다", "focus": ["me"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/users/me", "headers": ["Authorization: Bearer (만료된 토큰)"] },
        { "kind": "server", "text": "jjwt가 ExpiredJwtException → JwtProvider가 ApiException(UNAUTHORIZED)로 바꾼다" },
        { "kind": "response", "status": 401, "headers": ["WWW-Authenticate: Bearer"], "body": "{\n  \"status\": 401,\n  \"message\": \"토큰이 올바르지 않거나 만료되었습니다.\",\n  \"code\": \"UNAUTHORIZED\",\n  \"errors\": [],\n  \"data\": null\n}" },
        { "kind": "screen", "text": "프론트 래퍼가 code UNAUTHORIZED를 보고 로그인 화면으로 보낸다", "focus": ["toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 의존성 | jjwt **0.13.0** — `implementation 'io.jsonwebtoken:jjwt-api:0.13.0'`, `runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.13.0'`, `runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.13.0'` |
| 설정 | `app.jwt.secret`(32바이트 이상), `app.jwt.validity-seconds: 3600` — 아래 [설정](#설정) |
| 로그인 | `POST /api/v1/auth/login` — 이메일은 가입 때와 같이 다듬어(공백 제거·소문자) 찾는다. 없는 이메일·틀린 비밀번호 모두 **같은** 401 문구. 비밀번호는 비었는지만 검사한다(가입의 8~64자·72바이트 규칙을 다시 걸지 않는다 — 아래 설계 포인트) |
| 토큰 | HS256, `sub` = 회원 id(문자열), `iat`·`exp`, 유효 3600초. 응답 `{accessToken, expiresIn: 3600}` |
| 토큰 확인 | 인터셉터(`/api/**`, 가입·로그인 주소는 제외). 헤더가 없으면 `GET`은 비로그인으로 통과, 그 밖의 메서드는 401. 헤더가 있는데 `Bearer `로 시작하지 않거나, 서명이 틀리거나, 만료면 401. **CORS preflight(`OPTIONS`)는 통과** |
| 매개변수 | `@LoginUser Long userId` — 로그인이 필수면 없을 때 401. `@LoginUser(required = false)`면 비로그인일 때 `null`(목록·상세용, 10-6부터) |
| 내 정보 | `GET /api/v1/users/me` → `{id, email, nickname}` |
| 401 응답 | 공통 틀 + 헤더 `WWW-Authenticate: Bearer` |

**필드 규칙** — 로그인은 비었는지만 본다(가입 규칙을 다시 걸지 않는다 — 아래 설계 포인트). 잘못된 입력은 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `email` | 필수 | 안 됨 — 없음·`null`·`""`·공백만 거절 | — | 문자열(형식은 보지 않는다 — 틀린 형식은 없는 이메일과 같은 `401`) | 없음 | `400 VALIDATION_FAILED`, `errors`에 `email` |
| `password` | 필수 | 안 됨 — 없음·`null`·`""`·공백만 거절 | — | 문자열 | 없음 | `400`, `errors`에 `password` |
| 본문 전체 | 필수 | — | — | JSON, 각 값은 문자열 | — | `400 BAD_JSON` |

### 설정

`application.yml`에 더한다.

```yaml
app:
  jwt:
    # 예시용 비밀키 — 실제 서비스에서는 코드·저장소에 두지 않고 환경 변수 등으로 주입한다. HS256은 32바이트 이상
    secret: board-api-example-secret-key-change-me-0123456789
    validity-seconds: 3600
```

**이 비밀키는 실습용 예시 값이다.** 이 문서에 공개돼 있으니 누구나 이 키로 토큰을 만들 수 있다. 실제 서비스에서는 길고 무작위인 키를 환경 변수(`APP_JWT_SECRET`)나 비밀 저장소로 넣고, 깃에 올리지 않는다. 아래 확인의 "만료 토큰"(요청 M3)은 이 예시 키로 서명해 두었다. 다른 키를 쓰면 M3는 "만료"가 아니라 "서명 틀림"으로 401이 난다. 어느 쪽이든 결과는 같다.

## 설계 포인트

- **JWT는 암호화가 아니라 서명이다.** 점(`.`)으로 나뉜 세 덩어리 중 가운데(페이로드)는 Base64라 누구나 읽는다([jwt.io](https://jwt.io)에 붙여 보라). 비밀번호 같은 비밀은 넣지 않는다. 비밀키는 "위조 방지"에만 쓰인다.
- **인증은 컨트롤러보다 먼저.** 인터셉터는 컨트롤러 메서드 매개변수를 만들기(본문 읽기·`@Valid`) **전에** 돈다. 그래서 토큰 없는 `POST`는 본문이 깨져 있어도 401이다(10-5에서 확인한다).
- **`GET`은 비로그인 통과, 나머지는 막기.** 목록·상세는 비로그인도 보지만, 로그인하면 결과가 달라진다(내 비공개 글, "내가 좋아요했나"). 그래서 `GET`에서 헤더가 없으면 그냥 통과시키고, `@LoginUser(required = false)`가 `null`을 받는다. `GET /users/me`처럼 로그인이 필수인 `GET`은 매개변수 해석기가 401을 던진다.
- **헤더는 있는데 틀린 토큰은 `GET`이어도 401.** "토큰을 보냈는데 무시당함"보다 "토큰이 틀렸다"를 알려 주는 편이 프론트가 고치기 쉽다.
- **로그인 실패 문구를 하나로.** "없는 이메일입니다"와 "비밀번호가 틀렸습니다"를 나누면 남의 가입 여부를 캐낼 수 있다.
- **로그인에는 가입의 72바이트 규칙을 걸지 않는다.** 10-3에서 막은 것은 `encode`가 72바이트를 넘으면 예외를 던지기 때문이다. 로그인의 `matches`는 예외 없이 앞 72바이트만 비교해 500이 나지 않는다([F4](../../lessons/F4-password-storage.md)).
  가입이 72바이트를 넘는 비밀번호를 받지 않으니, 그런 입력은 틀린 비밀번호와 똑같이 401로 답하면 된다. 규칙은 비밀번호를 **정할 때**(가입) 검사한다 — 규칙이 바뀌어도 예전 규칙으로 가입한 회원은 로그인할 수 있어야 한다.
  단, 정확히 72바이트(한글 24자)로 가입한 회원은 뒤에 무엇을 붙여도 로그인된다. 앞 72바이트를 모두 알아야 하니 구멍은 아니다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 있으면 passwordEncoder.matches(원문, password_hash)
- JwtProvider가 sub=1, exp=지금+1시간으로 서명한 토큰을 만든다
- AuthInterceptor: Bearer 떼기 → 서명·만료 확인 → sub=1을 요청 속성에 → @LoginUser Long userId = 1
- jjwt가 ExpiredJwtException → JwtProvider가 ApiException(UNAUTHORIZED)로 바꾼다

<details>
<summary>Controller — HTTP 연결</summary>

`AuthController.java`, `AuthInterceptor.java`, `UserController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/v1/auth/login")`, `@GetMapping("/api/v1/users/me")`. 변경된 메서드: `login`, `preHandle`, `me`.

```java
@PostMapping("/api/v1/auth/login")
public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
    return ApiResponse.ok(authService.login(request));
}

@GetMapping("/api/v1/users/me")
public ApiResponse<UserResponse> me(@LoginUser Long userId) {
    return ApiResponse.ok(userService.me(userId));
}
```

인터셉터는 `OPTIONS` preflight를 통과시키고, `GET`에 헤더가 없으면 익명 조회를 허용한다. 다른 메서드에 토큰이 없거나 보낸 토큰이 틀리면 컨트롤러 전에 401을 던진다. 파일 전문은 아래 Controller 역할 접기에서 확인한다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`LoginRequest.java`, `TokenResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

```java
public record LoginRequest(
        @NotBlank(message = "이메일은 필수입니다.") String email,
        @NotBlank(message = "비밀번호는 필수입니다.") String password) {
    public LoginRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}

public record TokenResponse(String accessToken, long expiresIn) {
}
```

로그인 비밀번호는 `@NotBlank`만 검사한다. 가입 때의 길이·72바이트 규칙을 다시 적용하지 않는다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`AuthService.java`, `UserService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `login`, `me`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional(readOnly = true)
public TokenResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED, LOGIN_FAILED));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
        throw new ApiException(ErrorCode.UNAUTHORIZED, LOGIN_FAILED);
    }
    return new TokenResponse(jwtProvider.issue(user.getId()), jwtProvider.validitySeconds());
}

@Transactional(readOnly = true)
public UserResponse me(Long userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
    return UserResponse.from(user);
}
```

없는 이메일과 틀린 비밀번호가 같은 `LOGIN_FAILED` 문구를 쓴다. `me`는 DB에서 회원을 다시 읽어 해시가 빠진 DTO로 돌려준다.

</details>

<details>
<summary>MyBatis / Mapper — 가입에서 로그인·내 정보까지 이어가기</summary>

10-3의 MyBatis 선택 경로를 계속 쓸 때는 `findByEmail`과 `findById` SQL을 추가한다. `AuthService`는 첫 조회 결과가 없으면 401, 있으면 같은 `PasswordEncoder.matches`를 쓴다. `UserService.me`도 조회 결과가 없으면 401이다. 인터셉터·JWT·Controller의 계약은 JPA 경로와 같다.

```xml
<select id="findByEmail" resultType="org.example.board.user.User">
    SELECT id, email, password_hash, nickname, created_at
    FROM users WHERE email = #{email}
</select>
<select id="findById" resultType="org.example.board.user.User">
    SELECT id, email, password_hash, nickname, created_at
    FROM users WHERE id = #{id}
</select>
```

MyBatis 설정의 `map-underscore-to-camel-case: true`가 `password_hash`를 `passwordHash`에 매핑한다. 아래 **MyBatis 대체 구현 코드**에는 JPA Repository 삭제, POJO·Mapper·Service·설정의 파일 전문이 있다. 기본 10-4 스냅샷에 적용하면 독립적으로 실행된다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`GlobalExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다.

```java
private ResponseEntity<ApiResponse<Void>> fail(ErrorCode code, String message, List<FieldErrorItem> errors) {
    ResponseEntity.BodyBuilder builder = ResponseEntity.status(code.status());
    if (code == ErrorCode.UNAUTHORIZED) {
        builder.header(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
    }
    return builder.body(ApiResponse.fail(code, message, errors));
}
```

토큰 파싱·로그인·`@LoginUser`에서 발생한 401이 이 한곳을 거쳐 같은 응답 틀과 `WWW-Authenticate` 헤더를 받는다.

</details>

<details>
<summary>설정·보조 코드</summary>

`build.gradle`, `JwtProvider.java`, `LoginUser.java`, `LoginUserArgumentResolver.java`, `WebMvcConfig.java`, `application.yml`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `issue`, `validitySeconds`, `parseUserId`, `supportsParameter`.

```java
return Jwts.builder()
        .subject(String.valueOf(userId))
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(validitySeconds)))
        .signWith(key, Jwts.SIG.HS256)
        .compact();

String subject = Jwts.parser().verifyWith(key).build()
        .parseSignedClaims(token).getPayload().getSubject();
```

`JwtProvider`가 발급과 서명·만료 검사를 맡고, `WebMvcConfig`가 인터셉터와 `LoginUserArgumentResolver`를 등록한다. Resolver는 요청 속성의 회원 id를 `@LoginUser Long`에 넣고, 필수인데 없으면 401을 던진다. 예시 비밀키·의존성·전체 Java 코드는 아래 설정·보조 코드 접기에서 확인한다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
login() { curl -s -i -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' -d "$1"; echo; echo ----; }

login '{"email":"kim@example.com","password":"password1234"}'        # L 로그인
login '{"email":"kim@example.com","password":"wrong-pass"}'          # W 틀린 비밀번호
login '{"email":"nobody@example.com","password":"wrong-pass"}'       # U 없는 이메일
login '{"email":" KIM@Example.com ","password":"password1234"}'     # K 대소문자·공백
login '{"email":"kim@example.com"}'                                  # V 비밀번호 빠짐
login '{"email":"kim@example.com","password":"가가가가가가가가가가가가가가가가가가가가가가가가가"}'  # P 한글 25자(75바이트)

TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"kim@example.com","password":"password1234"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
curl -s -i "$BASE/api/v1/users/me" -H "Authorization: Bearer $TOKEN"; echo   # M 내 정보
curl -s -i "$BASE/api/v1/users/me"; echo                                     # M0 헤더 없음
curl -s -i "$BASE/api/v1/users/me" -H 'Authorization: Token abc'; echo      # M1 Bearer 아님

# M5 — preflight(브라우저가 Authorization을 싣기 전에 묻는 요청)는 토큰 없이도 통과해야 한다
curl -i -X OPTIONS "$BASE/api/v1/users/me" -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: authorization'
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. M2(서명 틀림)는 다른 키로, M3(만료)는 예시 키로 미리 서명해 둔 토큰이다.

```check
{
  "requests": [
    { "id": "L", "title": "로그인", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "password1234" } },
    { "id": "W", "title": "틀린 비밀번호", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "wrong-pass" } },
    { "id": "U", "title": "없는 이메일", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "nobody@example.com", "password": "wrong-pass" } },
    { "id": "K", "title": "대소문자·공백만 다른 이메일", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": " KIM@Example.com ", "password": "password1234" } },
    { "id": "V", "title": "비밀번호 빠짐", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com" } },
    { "id": "P", "title": "한글 25자 비밀번호(75바이트)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "가가가가가가가가가가가가가가가가가가가가가가가가가" } },
    {"id": "V1", "title": "빈 객체", "method": "POST", "path": "/api/v1/auth/login", "body": {}},
    {"id": "V2", "title": "둘 다 빈 문자열", "method": "POST", "path": "/api/v1/auth/login", "body": {"email": "", "password": ""}},
    {"id": "V3", "title": "이메일 null", "method": "POST", "path": "/api/v1/auth/login", "body": {"email": null, "password": "password1234"}},
    {"id": "V4", "title": "비밀번호 공백만", "method": "POST", "path": "/api/v1/auth/login", "body": {"email": "kim@example.com", "password": "   "}},
    {"id": "V5", "title": "깨진 JSON", "method": "POST", "path": "/api/v1/auth/login", "headers": {"Content-Type": "application/json"}, "body": "{\"email\":"},
    {"id": "V6", "title": "비밀번호 자리에 배열", "method": "POST", "path": "/api/v1/auth/login", "body": {"email": "kim@example.com", "password": ["password1234"]}},
    { "id": "M", "title": "내 정보", "method": "GET", "path": "/api/v1/users/me", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "M0", "title": "헤더 없음", "method": "GET", "path": "/api/v1/users/me" },
    { "id": "M1", "title": "Bearer 아님", "method": "GET", "path": "/api/v1/users/me", "headers": { "Authorization": "Token abc" } },
    { "id": "M2", "title": "서명 틀림", "method": "GET", "path": "/api/v1/users/me", "headers": { "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzY3MjI1NjAwLCJleHAiOjQxMDI0NDQ4MDB9.8tkf3cuMdbvWnSNMb5Eg3Jl6T9XEBPEvwmdHDayGx6k" } },
    { "id": "M3", "title": "만료(2026-01-01 발급, 1시간)", "method": "GET", "path": "/api/v1/users/me", "headers": { "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzY3MjI1NjAwLCJleHAiOjE3NjcyMjkyMDB9.O9UEF68q_1e6oiEif_yQxyarpM7zGJeCcOU-YMxzlrE" } },
    { "id": "M4", "title": "JWT 모양이 아님", "method": "GET", "path": "/api/v1/users/me", "headers": { "Authorization": "Bearer not.a.jwt" } }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "L",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.status", "equals": 200 },
          { "path": "$.data.accessToken", "matches": "^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$" },
          { "path": "$.data.expiresIn", "equals": 3600 }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        { "request": "W", "expect": { "status": 401, "headers": { "WWW-Authenticate": { "matches": "^Bearer" } }, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }, { "path": "$.data", "type": "null" }] } },
        { "request": "U", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }, { "path": "$.message", "equals": "{{W.body.message}}" }] } }
      ],
      "note": "없는 이메일과 틀린 비밀번호의 응답이 같아야 한다"
    },
    { "id": "C3", "request": "K", "expect": { "status": 200, "json": [{ "path": "$.data.accessToken", "type": "string" }] } },
    { "id": "C4", "request": "V", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "VALIDATION_FAILED" }, { "path": "$.errors[*].field", "contains": "password" }] } },
    {
      "id": "C5",
      "request": "M",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.data.id", "equals": 1 },
          { "path": "$.data.email", "equals": "kim@example.com" },
          { "path": "$.data.nickname", "equals": "김자바" },
          { "path": "$.data.passwordHash", "exists": false }
        ]
      }
    },
    { "id": "C6", "request": "M0", "expect": { "status": 401, "headers": { "WWW-Authenticate": { "matches": "^Bearer" } }, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }, { "path": "$.errors", "equals": [] }, { "path": "$.data", "type": "null" }] } },
    {
      "id": "C7",
      "all": [
        { "request": "M1", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } },
        { "request": "M2", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } },
        { "request": "M3", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } },
        { "request": "M4", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } }
      ]
    },
    {
      "id": "C8",
      "manual": "preflight — 브라우저 코드는 OPTIONS 요청을 직접 못 만든다. 위 요청 M5(curl)가 토큰 없이 200이고 Access-Control-Allow-Headers에 authorization이 있는지 본다(401이면 인터셉터가 preflight를 막은 것)"
    },
    { "id": "C9", "request": "P", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }, { "path": "$.message", "equals": "{{W.body.message}}" }] } },
    {"id": "C10", "all": [{"request": "V1", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "email"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}, {"request": "V1", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "password"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}, {"request": "V2", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "email"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}, {"request": "V2", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "password"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}, {"request": "V3", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "email"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}, {"request": "V4", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "password"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}]},
    {"id": "C11", "all": [{"request": "V5", "expect": {"status": 400, "json": [{"path": "$.code", "equals": "BAD_JSON"}]}}, {"request": "V6", "expect": {"status": 400, "json": [{"path": "$.code", "equals": "BAD_JSON"}]}}]}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 L | `200`, `data.accessToken`이 `xxx.yyy.zzz` 모양, `data.expiresIn`=`3600` |
| C2 | 요청 W·U | 둘 다 `401 UNAUTHORIZED`, `WWW-Authenticate: Bearer`, **`message`가 서로 같다** |
| C3 | 요청 K | `200` — 가입 때와 같은 규칙으로 이메일을 다듬어 찾는다 |
| C4 | 요청 V | `400 VALIDATION_FAILED`, `errors`에 `password` |
| C5 | 요청 M | `200`, `data` = `{id: 1, email: kim@example.com, nickname: 김자바}`, 해시 없음 |
| C6 | 요청 M0 | `401 UNAUTHORIZED`, `WWW-Authenticate: Bearer`, `errors`=`[]`, `data`=`null` |
| C7 | 요청 M1~M4 | 모두 `401 UNAUTHORIZED` — Bearer 아님·서명 틀림·만료·모양 깨짐 |
| C8 | 요청 M5 (curl) | 토큰 없는 preflight가 `200`, `Access-Control-Allow-Headers`에 `authorization` |
| C9 | 요청 P | `401 UNAUTHORIZED`, `message`가 요청 W와 같다 — 72바이트를 넘는 비밀번호도 틀린 비밀번호다. `500`이면 로그인에서 `encode`를 부르고 있다 |
| C10 | V1 / V2 / V3 / V4 | 빈 객체·둘 다 빈 문자열은 `errors`에 `email`·`password` 둘 다, 이메일 `null`은 `email`, 비밀번호 공백만은 `password` — 모두 `400 VALIDATION_FAILED`(`401`·`500`이 아니다) |
| C11 | V5 / V6 | 깨진 JSON·비밀번호 자리에 배열 → `400 BAD_JSON` |
| R1 | 토큰 확인 위치 | 컨트롤러마다 헤더를 읽지 않고 인터셉터 한곳에서 확인한다. 컨트롤러는 `@LoginUser`로 id만 받는다 |
| R2 | 비밀키 | 코드에 문자열로 박지 않고 설정(`app.jwt.secret`)에서 읽는다 |
| R3 | 예외 | jjwt의 예외(`JwtException`)를 그대로 흘리지 않고 401 `ApiException`으로 바꾼다(그대로 두면 500) |
| R4 | 비교 | 비밀번호는 `passwordEncoder.matches(원문, 해시)`로 비교한다(다시 해시해서 문자열 비교하지 않는다 — 솔트 때문에 매번 다르고, 한글 25자 같은 72바이트 초과 입력은 `encode`가 예외를 던져 500이 된다) |

## 필요한 지식

- [F5 JWT 해부](../../lessons/F5-jwt-anatomy.md) — 토큰의 세 덩어리, 서명·만료 검증이 실패하는 모습
- [F2 인증과 토큰](../../lessons/F2-auth-token.md) — 로그인 상태를 서버가 아는 법
- [F3 CORS](../../lessons/F3-cors.md) — preflight가 토큰 없이 오는 이유
- [B8 어노테이션은 무엇인가](../../lessons/B8-annotations.md) — `@LoginUser`를 직접 만든다
- [F4 비밀번호 저장](../../lessons/F4-password-storage.md) — `matches`가 앞 72바이트만 비교하는 이유
- [S13 JWT·OAuth2](../../docs/knowledge/S13-jwt-oauth2.md) — JWT 구조, 서명, 만료
- [S12 Spring Security 구조](../../docs/knowledge/S12-security-architecture.md) — 더 깊이
- [1-6. 토큰 인증](../ch1-create-post/1-6-token-auth.md) — 같은 인터셉터 방식(DB 토큰 버전)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 파일 구성</summary>

`org.example.board.auth` 패키지에 둔다.

- `JwtProvider`(`@Component`) — `issue(Long userId)`, `parseUserId(String token)`
- `LoginUser`(애노테이션) — `boolean required() default true;`
- `AuthInterceptor`(`HandlerInterceptor`) — 헤더 확인 → `request.setAttribute("loginUserId", id)`
- `LoginUserArgumentResolver`(`HandlerMethodArgumentResolver`) — 속성에서 id를 꺼내 매개변수에 넣는다
- `WebMvcConfig`(`WebMvcConfigurer`) — 인터셉터·해석기 등록
- `AuthController`·`AuthService`·`LoginRequest`·`TokenResponse`

`GET /users/me`는 `UserController`에 더한다.
</details>

<details>
<summary>힌트 2 — jjwt 0.13 사용법</summary>

```java
SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

String token = Jwts.builder()
        .subject(String.valueOf(userId))
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(3600)))
        .signWith(key, Jwts.SIG.HS256)
        .compact();

String sub = Jwts.parser().verifyWith(key).build()
        .parseSignedClaims(token).getPayload().getSubject();
```

`parseSignedClaims`는 서명이 틀리면 `SignatureException`, 만료면 `ExpiredJwtException`, 모양이 깨지면 `MalformedJwtException`을 던진다. 모두 `JwtException`의 자식이다. 이것을 잡아 `ApiException(UNAUTHORIZED)`로 바꾼다.

jjwt-jackson은 Jackson **2**(`com.fasterxml.jackson.core:jackson-databind`)를 따로 끌어온다. Boot 4.1.1은 Jackson 3(`tools.jackson`)을 쓰지만 패키지가 달라서 둘이 함께 있어도 충돌하지 않는다(실측: 2.21.5와 3.1.5가 함께 올라오고 로그인·검증 모두 정상).
</details>

<details>
<summary>힌트 3 — 비밀키가 짧으면</summary>

`app.jwt.secret`을 `short-secret`처럼 짧게 두면 앱이 뜨지 않는다.

```text
Caused by: io.jsonwebtoken.security.WeakKeyException: The specified key byte array is 96 bits which is not secure enough for any JWT HMAC-SHA algorithm.  The JWT JWA Specification (RFC 7518, Section 3.2) states that keys used with HMAC-SHA algorithms MUST have a size >= 256 bits (the key size must be greater than or equal to the hash output size).
```

HS256은 키가 256비트(32바이트) 이상이어야 한다.
</details>

<details>
<summary>힌트 4 — 인터셉터 뼈대</summary>

```java
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    if (CorsUtils.isPreFlightRequest(request)) return true;          // preflight 통과
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null) {
        if (HttpMethod.GET.matches(request.getMethod())) return true; // 비로그인 조회
        throw new ApiException(ErrorCode.UNAUTHORIZED);
    }
    if (!header.startsWith("Bearer ")) throw new ApiException(ErrorCode.UNAUTHORIZED);
    request.setAttribute("loginUserId", jwtProvider.parseUserId(header.substring(7).trim()));
    return true;
}
```

등록할 때 `.excludePathPatterns("/api/v1/users", "/api/v1/auth/login")` — 토큰을 받으러 오는 요청에 토큰을 요구하면 아무도 로그인할 수 없다.

인터셉터에서 던진 예외도 `@RestControllerAdvice`가 받는다(인터셉터는 DispatcherServlet 안에서 돈다). 401 응답에 `WWW-Authenticate` 헤더를 붙이는 일은 전역 처리기의 `fail(...)`에서 `UNAUTHORIZED`일 때 하면 한곳으로 모인다.
</details>

<details>
<summary>더 깊이 — Spring Security로 옮긴다면</summary>

같은 일을 Security에서는 `SecurityFilterChain` + `OncePerRequestFilter`(JWT 필터)로 한다. 인터셉터보다 앞(서블릿 필터)에서 돌고, `@AuthenticationPrincipal`이 `@LoginUser` 역할을 한다.

401·403 응답 모양은 `AuthenticationEntryPoint`·`AccessDeniedHandler`로 맞춘다. 실무 코드에서 이 이름들을 보면 이 단계에서 만든 것의 자리라고 생각하면 된다.

이 장은 Security 없이 끝까지 간다. </details>

## 다음 단계

[10-5. 게시글 작성](10-5-create-post.md) — 토큰 주인을 작성자로 글을 저장한다. 처음으로 JPA 연관관계(작성자·태그)를 쓴다.
