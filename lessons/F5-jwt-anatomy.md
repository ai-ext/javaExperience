# F5. JWT 해부 — 토큰 안에 무엇이 있나

> 개념 레슨 · 35분

## 이게 뭐냐

[F2](./F2-auth-token.md)에서 서버가 "누구인지" 아는 세 방법(세션·DB 토큰·JWT)을 비교했다. JWT는 서버가 **저장하지 않는** 토큰이다. 서버는 요청이 올 때마다 토큰의 **서명**만 검사하고, 그 안에 적힌 회원 id를 믿는다. 이 레슨은 그 토큰을 직접 열어 본다.

클라이언트는 로그인 응답으로 `accessToken`을 받아 두고, 요청마다 헤더에 싣는다.

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzkxNTk3MTUyLCJleHAiOjE3OTE2MDA3NTJ9.FOAi_fxDACG7JcbFBdoPVUp_A6wFYubWdfwrPK5BdaQ
```

알아보기 힘든 긴 글자지만 **점(`.`) 두 개로 나뉜 세 덩어리**다.

| 덩어리 | 원래 내용(실측) | 뜻 |
|---|---|---|
| ① header | `{"alg":"HS256"}` | 서명 방식 |
| ② payload | `{"sub":"1","iat":1791597152,"exp":1791600752}` | 담은 정보(클레임) |
| ③ signature | 32바이트 | ①·②를 비밀키로 계산한 **서명** |

### Base64URL은 암호화가 아니다

①·②는 JSON 글자를 **Base64URL**로 바꾼 것이다. Base64URL은 아무 바이트나 URL·헤더에 넣어도 안전한 글자(`A-Z a-z 0-9 - _`)로 옮겨 적는 방법일 뿐이다. 키 없이 **누구나** 되돌린다. 아래 예시에서 Java(jshell)로 바로 읽었다.

그래서 **payload에는 비밀을 넣지 않는다.** 비밀번호·주민번호·전화번호는 안 된다. 10장은 회원 id(`sub`)만 넣는다. JWT의 서명은 **봉인 스티커**다. 내용을 숨기지는 않고, 누가 뜯었는지(바꿨는지)만 알려 준다.

### payload의 클레임

| 클레임 | 이름 | 10장에서 | 비고 |
|---|---|---|---|
| `sub` | subject — 이 토큰의 주인 | 회원 id `"1"` | 글자다. `Long.valueOf`로 바꿔 쓴다 |
| `iat` | issued at — 발급 시각 | 지금 | **초** 단위 숫자(1970-01-01 UTC부터) |
| `exp` | expiration — 만료 시각 | 지금 + 3600초 | 이 시각이 지나면 거절 |
| `iss`·`aud` | 발급자·받을 곳 | 안 씀 | 여러 서비스가 토큰을 주고받을 때 확인 |

`iat`·`exp`는 **초**다. Java `Instant.ofEpochSecond(exp)`로 시각이 된다. 밀리초를 받는 곳(Java `new Date(long)`, JS `Date`)에 넣으려면 1000을 곱해야 하고, 빼먹으면 1970년이 된다(아래 따라 해 보기).

### 서명 — 비밀키를 가진 쪽만 만들 수 있다

HS256 서명은 "①.② 글자 + 비밀키"로 계산한 32바이트다. 검증할 때 서버는 받은 ①·②로 서명을 **다시 계산해서** ③과 같은지 본다.

- payload의 `sub`를 `1`에서 `2`로 바꾸면 서명이 안 맞는다. 맞는 서명을 새로 만들려면 비밀키가 있어야 한다.
- 그래서 비밀키는 서버 밖으로 나가면 안 된다. 키가 새면 누구나 아무 회원의 토큰을 만든다. 10장 `application.yml`의 키는 예시용이고, 실제 서비스는 환경 변수 등으로 넣는다.
- HS256 키는 **32바이트(256비트) 이상**이어야 한다(RFC 7518). jjwt는 짧은 키를 아예 거절한다(일부러 틀려 보기 ④).
- RS256이라는 방식도 있다. 개인 키로 서명하고 **공개 키**로 검증해서, 검증만 하는 서버들에 비밀을 나눠 줄 필요가 없다. 10장은 서버 한 대라 HS256이다.

### 서버가 지킬 것

- **알고리즘은 서버가 정한다.** 토큰 header의 `alg`를 믿으면 `"alg":"none"`(서명 없음) 같은 토큰이 통과할 수 있다. jjwt는 기본으로 거절한다(일부러 틀려 보기 ⑤).
- **만료를 짧게.** JWT는 서버가 저장하지 않아서, 발급한 뒤에는 만료 전까지 막기 어렵다(F2 확인 문제 5). 10장은 1시간이다.
- **실패하면 `401`.** 서명이 틀렸든 만료됐든 형식이 깨졌든 응답은 하나다. 10장 `JwtProvider`는 jjwt의 예외를 모두 `JwtException`으로 잡아 `401`로 바꾼다. 아래 예외들이 전부 `JwtException`의 자식이라 한 번에 잡힌다(실측).
- **토큰을 어디에 두나**(API를 호출하는 브라우저): `localStorage`는 페이지의 JS가 읽을 수 있어 XSS(남의 스크립트가 끼어드는 공격)에 털린다. `HttpOnly` 쿠키는 JS가 못 읽지만 브라우저가 자동으로 붙여 CSRF 방어가 필요하다(F2). 정답 하나는 없고, 둘의 약점을 알고 고른다.

## 예시

javaExperience에는 jjwt가 없다. `build.gradle`의 `dependencies`에 10-4와 같은 세 줄을 넣는다.

```groovy
implementation 'io.jsonwebtoken:jjwt-api:0.13.0'
runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.13.0'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.13.0'
```

`org.example.lesson`에 아래 클래스를 만들고 `main` 옆 ▶로 실행한다. 발급·검증은 10장 `JwtProvider`와 같은 호출이다.

```java
package org.example.lesson;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

// 연습용 — JWT를 만들고, 점으로 자르고, 열어 본다. 10장 JwtProvider와 같은 방식. 다 보면 지운다
public class JwtDemo {

    public static void main(String[] args) {
        // 10장 application.yml의 예시 비밀키 — 실제 서비스에서는 코드에 두지 않는다
        String secret = "board-api-example-secret-key-change-me-0123456789";
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        // 발급 — sub = 회원 id, 유효 1시간
        Instant now = Instant.now();
        String token = Jwts.builder()
                .subject("1")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
        System.out.println("token: " + token);

        // 점으로 자르고, 앞의 두 덩어리를 Base64URL로 되돌린다 — 키가 필요 없다
        String[] parts = token.split("\\.");
        Base64.Decoder decoder = Base64.getUrlDecoder();
        System.out.println("덩어리 수: " + parts.length);
        System.out.println("header : " + new String(decoder.decode(parts[0]), StandardCharsets.UTF_8));
        System.out.println("payload: " + new String(decoder.decode(parts[1]), StandardCharsets.UTF_8));
        System.out.println("signature: " + decoder.decode(parts[2]).length + "바이트");

        // 검증 — 키로 서명을 다시 계산해 맞는지 보고, 만료도 본다
        Claims claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
        System.out.println("검증 통과: sub=" + claims.getSubject() + ", exp=" + claims.getExpiration().toInstant());
    }
}
```

```text
token: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzkxNTk3MTUyLCJleHAiOjE3OTE2MDA3NTJ9.FOAi_fxDACG7JcbFBdoPVUp_A6wFYubWdfwrPK5BdaQ
덩어리 수: 3
header : {"alg":"HS256"}
payload: {"sub":"1","iat":1791597152,"exp":1791600752}
signature: 32바이트
검증 통과: sub=1, exp=2026-10-10T02:52:32Z
```

- `iat`·`exp`와 토큰 글자는 실행할 때마다 바뀐다. header 덩어리(`eyJhbGciOiJIUzI1NiJ9`)는 늘 같다. 내용(`{"alg":"HS256"}`)이 같기 때문이다.
- `exp - iat = 3600`. 1시간이다.
- header·payload가 `eyJ`로 시작하는 이유: `{"` 다음에 영문 키가 오는 JSON을 Base64로 바꾸면 앞이 `eyJ`가 된다. 로그에서 `eyJ…`를 보면 JWT를 의심한다.
- `jjwt-jackson`은 Jackson **2**를 쓴다. Boot 4의 Jackson 3와 같이 들어 있어도 문제없이 돌았다(D1).

## 따라 해 보기

10분.

1. javaExperience `build.gradle`에 jjwt 세 줄을 넣고 Gradle을 새로 고친 뒤 `JwtDemo`를 실행한다. 출력의 `token:` 뒤 글자를 복사한다.
2. 터미널에서 `jshell`을 열고 토큰을 연다. URL용 디코더(`getUrlDecoder`)로 읽어야 `-`·`_`가 섞인 토큰이 풀린다.

```java
String token = "여기에 붙여 넣기";
String[] part = token.split("\\.");
var url = java.util.Base64.getUrlDecoder();
System.out.println(new String(url.decode(part[0])));           // header
System.out.println(new String(url.decode(part[1])));           // payload
System.out.println(java.time.Instant.ofEpochSecond(1791600752)); // exp는 "초"
System.out.println(java.time.Instant.ofEpochMilli(1791600752));  // 밀리초로 착각하면
java.util.Base64.getDecoder().decode(part[2]);                 // URL용이 아닌 디코더로 서명을 읽으면
```

위 토큰으로 Java 21 jshell에서 실행한 결과:

```text
{"alg":"HS256"}
{"sub":"1","iat":1791597152,"exp":1791600752}
2026-10-10T02:52:32Z
1970-01-21T17:40:00.752Z
Exception java.lang.IllegalArgumentException: Illegal base64 character 5f
```

마지막 줄의 `5f`는 `_` 글자다. 서명에 `_`가 들어 있어 일반 Base64 디코더는 못 읽는다 — 그래서 JWT는 **URL용** Base64를 쓴다.

3. 일부러 틀려 보기의 다섯 가지를 하나씩 `main` 끝에 붙여 실행하고, 예외 이름과 첫 줄을 아래와 비교한다.
4. 진짜 서비스의 토큰을 jwt.io 같은 바깥 사이트에 붙여 넣지 않는다. `Bearer` 토큰은 가진 사람이 곧 그 회원이다(F2). 열어 볼 때는 위처럼 내 컴퓨터(jshell)에서 한다.
5. `JwtDemo`를 지운다.

## 일부러 틀려 보기

모두 `JwtDemo`의 `main` 끝에 **하나씩** 붙여 실행했다. 예외 아래의 `at …` 줄은 생략했다.

### ① payload를 고친다 — `sub`를 1에서 2로

```java
String forgedPayload = new String(decoder.decode(parts[1]), StandardCharsets.UTF_8).replace("\"sub\":\"1\"", "\"sub\":\"2\"");
String forged = parts[0] + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(forgedPayload.getBytes(StandardCharsets.UTF_8)) + "." + parts[2];
System.out.println("forged payload: " + forgedPayload);
Jwts.parser().verifyWith(key).build().parseSignedClaims(forged);
```

```text
forged payload: {"sub":"2","iat":1791597171,"exp":1791600771}
Exception in thread "main" io.jsonwebtoken.security.SignatureException: JWT signature does not match locally computed signature. JWT validity cannot be asserted and should not be trusted.
```

payload는 누구나 읽고 **고칠 수도** 있다. 하지만 고친 payload로 계산한 서명이 원래 서명과 다르다. 서버는 이 토큰을 거절한다.

### ② 서명 한 글자를 바꾼다

```java
char[] sig = parts[2].toCharArray();
sig[10] = (sig[10] == 'A') ? 'B' : 'A';
Jwts.parser().verifyWith(key).build().parseSignedClaims(parts[0] + "." + parts[1] + "." + new String(sig));
```

①과 같은 `SignatureException`이다. 서명이 "이 내용과 이 키로 계산한 값"과 한 비트라도 다르면 실패한다. 가운데 글자를 바꾼 데는 이유가 있다. 32바이트 서명을 43글자로 적으면 **마지막 글자**에는 쓰이지 않는 비트 2개가 섞인다. 그 비트만 바뀌는 글자(예: `c` → `d`)로 바꿨더니 되돌린 바이트가 같아서 검증을 **통과했다**(실측). 서명이 깨지지 않은 것이니 보안 문제는 아니다.

### ③ 만료된 토큰

```java
String expired = Jwts.builder().subject("1")
        .expiration(Date.from(now.minusSeconds(10)))
        .signWith(key, Jwts.SIG.HS256).compact();
Jwts.parser().verifyWith(key).build().parseSignedClaims(expired);
```

```text
Exception in thread "main" io.jsonwebtoken.ExpiredJwtException: JWT expired 10718 milliseconds ago at 2026-10-10T01:52:42.000Z. Current time: 2026-10-10T01:52:52.718Z. Allowed clock skew: 0 milliseconds.
```

서명은 맞지만 `exp`가 지났다. `Allowed clock skew: 0` — 서버끼리 시계가 조금 어긋나도 봐주는 여유가 0초라는 뜻이다. 10장은 이 경우도 `401`이고, 클라이언트는 사용자를 다시 로그인시킨다.

### ④ 짧은 비밀키

```java
Keys.hmacShaKeyFor("secret".getBytes(StandardCharsets.UTF_8));
```

```text
Exception in thread "main" io.jsonwebtoken.security.WeakKeyException: The specified key byte array is 48 bits which is not secure enough for any JWT HMAC-SHA algorithm.  The JWT JWA Specification (RFC 7518, Section 3.2) states that keys used with HMAC-SHA algorithms MUST have a size >= 256 bits (the key size must be greater than or equal to the hash output size).  …
```

`secret`은 6바이트(48비트)다. 31바이트도 같은 예외였고 32바이트부터 통과했다. 10장에서 `app.jwt.secret`을 짧게 바꾸면 `JwtProvider`를 만들 때 이 예외가 나서 **앱이 뜨지 않는다.** 10장 예시 키는 49바이트다.

### ⑤ 서명 없는 토큰(`"alg":"none"`)

```java
String none = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8));
Jwts.parser().verifyWith(key).build().parseSignedClaims(none + "." + parts[1] + ".");
```

```text
Exception in thread "main" io.jsonwebtoken.UnsupportedJwtException: Unsecured JWSs (those with an 'alg' (Algorithm) header value of 'none') are disallowed by default as mandated by https://www.rfc-editor.org/rfc/rfc7518.html#section-3.6. …
```

header에 "서명 안 했음"이라고 적어 보내는 공격이다. 서버가 header의 `alg`를 그대로 믿으면 서명 검사를 건너뛴다. jjwt는 기본으로 거절한다.

## 확인 문제

**1.** 동료가 "JWT는 암호화돼 있으니 payload에 이메일·전화번호를 넣어도 된다"고 한다. 맞나?

<details>
<summary>정답</summary>

틀렸다. header·payload는 Base64URL로 **옮겨 적은** 것일 뿐이라 키 없이 누구나 읽는다(예시에서 Java `Base64.getUrlDecoder()`로 바로 읽었다). 서명은 내용을 숨기지 않고 바뀌었는지만 확인한다. 보여도 괜찮은 최소한(회원 id)만 넣는다.
</details>

**2.** 공격자가 자기 토큰의 payload를 `{"sub":"1"}`로 고쳐 운영자(1번)인 척한다. 서버에서 무슨 일이 생기나?

<details>
<summary>정답</summary>

서명 검증에서 `SignatureException`(① 실측)이 난다. 서버는 받은 header·payload로 서명을 다시 계산하는데, 고친 payload로는 원래 서명과 맞지 않는다. 맞는 서명을 만들려면 서버의 비밀키가 필요하다. 10장 `JwtProvider`는 이 예외를 잡아 `401`로 답한다.
</details>

**3.** payload에 `"exp":1791600752`가 있다. 이 숫자의 단위는? Java에서 시각으로 바꾸려면? 서버는 이 값으로 무엇을 하나?

<details>
<summary>정답</summary>

**초**(1970-01-01 UTC부터 지난 초)다. Java에서는 `Instant.ofEpochSecond(1791600752)` → `2026-10-10T02:52:32Z`. 밀리초를 받는 `new Date(…)`에 그대로 넣으면 1970-01-21이 된다(실측). 1000을 곱해야 한다. 서버는 검증할 때 지금 시각이 `exp`를 지났으면 `ExpiredJwtException`(③)으로 거절한다.
</details>

**4.** `app.jwt.secret`을 `my-secret`으로 바꿨더니 앱이 뜨지 않는다. 왜? 어떻게 고치나?

<details>
<summary>정답</summary>

HS256 키는 256비트(32바이트) 이상이어야 한다(RFC 7518). `my-secret`은 9바이트라 `Keys.hmacShaKeyFor`가 `WeakKeyException`(④ 실측)을 던지고, 이걸 생성자에서 부르는 `JwtProvider` 빈을 못 만들어 앱이 멈춘다. 32바이트가 넘는 무작위 키로 바꾸고, 코드·저장소가 아니라 환경 변수 등으로 넣는다.
</details>

**5.** 회원이 로그아웃했다. 클라이언트가 갖고 있던 토큰을 지웠지만, 그 토큰을 미리 복사해 둔 사람이 있다. 그 토큰은 언제까지 쓸 수 있나? 줄이는 방법은?

<details>
<summary>정답</summary>

`exp`까지 쓸 수 있다. 서버는 토큰을 저장하지 않고 서명과 만료만 보기 때문에 "이 토큰은 로그아웃됐다"를 모른다(F2 확인 문제 5). 줄이는 방법: 만료를 짧게 하고(10장 1시간), 짧은 access token + 따로 폐기할 수 있는 refresh token으로 나누거나, 막을 토큰 목록(denylist)을 두고 매번 확인한다. 목록을 두면 서버가 다시 무언가를 저장하게 되니 DB 토큰 방식과 비슷해진다.
</details>

## 더 깊이

- [RFC 7519 — JWT](https://www.rfc-editor.org/rfc/rfc7519.html) — 구조와 등록 클레임(`sub`·`iat`·`exp`·`iss`·`aud`)
- [RFC 7518 — JWA](https://www.rfc-editor.org/rfc/rfc7518.html) — HS256·RS256, 키 길이(3.2절), `none`(3.6절)
- [RFC 6750 — Bearer Token](https://www.rfc-editor.org/rfc/rfc6750.html) — `Authorization: Bearer`, `401`과 `WWW-Authenticate`
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html) — 알고리즘 고정, 폐기, 저장 위치
- [jjwt 0.13.0 README](https://github.com/jwtk/jjwt/blob/0.13.0/README.adoc) — `signWith`·`verifyWith`·`parseSignedClaims`, 의존성 세 줄
- [S13 JWT·OAuth2](../docs/knowledge/S13-jwt-oauth2.md) · [D11 웹 보안 기초](../docs/knowledge/D11-web-security-basics.md) · [S12 Spring Security 아키텍처](../docs/knowledge/S12-security-architecture.md)

## 다음

실습: [10-4. 로그인과 JWT — 인터셉터와 @LoginUser, 내 정보](../scenario/ch10-project/10-4-login-jwt.md) — 로그인에서 이 토큰을 발급하고, 인터셉터가 요청마다 서명·만료를 확인해 실패하면 `401`로 답한다.
