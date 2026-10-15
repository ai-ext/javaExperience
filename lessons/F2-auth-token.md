# F2. 인증과 토큰

> 개념 레슨 · 35분

## 이게 뭐냐

HTTP 요청은 하나하나가 **따로**다. 서버는 방금 온 요청과 1초 전 요청이 같은 사람인지 스스로 알지 못한다. 그래서 로그인한 뒤에는 **매 요청마다** "나는 누구다"를 증명하는 무언가를 실어 보내야 한다.

보내는 쪽에서 보면 둘 중 하나다.

- `curl -b jar.txt …` — 로그인 때 받아 파일에 저장해 둔 쿠키를 다시 보낸다(아래 예시). 브라우저는 이 일을 자동으로 한다.
- `curl -H "Authorization: Bearer tok-lee" …` — 로그인 응답으로 받은 토큰을 헤더에 싣는다.

이 레슨은 서버가 그걸 받아 "누구인지" 알아내는 방법이다.

### 인증과 인가

| | 질문 | 실패하면 |
|---|---|---|
| **인증**(authentication) | 너 누구야? | `401 Unauthorized` — 누군지 모른다. 응답 헤더 `WWW-Authenticate`로 "이 방식으로 증명해 와"를 알려 준다 |
| **인가**(authorization) | 너 이거 해도 돼? | `403 Forbidden` — 누군지는 안다. 그래도 안 된다 |

이름이 헷갈리지만 `401`의 영어 이름 `Unauthorized`는 실제로는 "인증 안 됨"이다. 순서는 항상 **인증 먼저**다. 누군지 모르면 권한을 따질 수도 없다.

### 서버가 "누구인지" 기억하는 세 가지 방법

| 방법 | 클라이언트가 보내는 것 | 서버가 하는 일 | 서버를 재시작하면 | 강제 로그아웃 |
|---|---|---|---|---|
| **세션 + 쿠키** | `Cookie: JSESSIONID=…`(브라우저가 자동으로) | 서버 **메모리**의 세션 저장소에서 그 id를 찾는다 | 메모리라면 다 풀린다(아래 예시) | 세션을 지우면 끝 |
| **토큰(DB 조회형)** | `Authorization: Bearer tok-lee` | **DB**에서 토큰을 찾아 주인·만료·폐기를 본다. 이 실습(`api_token` 테이블)이 이 방식 | 그대로 | `revoked_at`을 찍으면 끝 |
| **JWT** | `Authorization: Bearer eyJ…`(서명된 긴 문자열) | 저장소를 안 본다. **서명**만 검사하고 안에 적힌 회원 id·만료를 믿는다 | 그대로 | 만료 전까지 막기 어렵다(따로 차단 목록이 필요) |

- **쿠키**는 브라우저가 같은 서버로 가는 요청에 **자동으로** 붙인다. 클라이언트 코드가 손대지 않아도 된다. 대신 다른 사이트가 유도한 요청에도 붙을 수 있어 CSRF 방어가 따로 필요하다.
- **`Authorization` 헤더**는 클라이언트가 **직접** 붙인다. 모바일 앱·다른 서버도 똑같이 쓸 수 있어 API에 흔하다.
- `Bearer`는 "소지자"라는 뜻이다. 그 문자열을 **가진 사람이면 누구든** 그 회원이 된다. 그래서 토큰은 비밀번호처럼 다룬다. 로그에 찍지 않고, 주소창(쿼리)에 넣지 않는다.

## 예시

### 세션 — 서버 메모리가 기억한다

연습용 컨트롤러 하나로 세션을 눈으로 본다. 1-6 정답 코드에 이 클래스만 더해 실행했다.

```java
package org.example.demo;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// 연습용 — 세션이 "누가 몇 번 왔는지"를 서버에 기억하는 모습을 본다. 다 보면 지운다
@RestController
public class VisitController {

    @GetMapping("/demo/visit")
    public Map<String, Object> visit(HttpSession session) {
        Integer count = (Integer) session.getAttribute("count");
        count = (count == null) ? 1 : count + 1;
        session.setAttribute("count", count);
        return Map.of("sessionId", session.getId(), "count", count);
    }
}
```

`HttpSession`을 매개변수로 받으면 Spring이 이 요청의 세션을 찾아 준다. 없으면 새로 만든다. curl의 `-c jar.txt`는 받은 쿠키를 파일에 저장하고, `-b jar.txt`는 그 쿠키를 다시 보낸다(브라우저가 자동으로 하는 일을 손으로).

```text
$ curl -i -c jar.txt http://localhost:8080/demo/visit
HTTP/1.1 200
Set-Cookie: JSESSIONID=155FB092B3BBCC0EBFC3C19DAB304DB8; Path=/; HttpOnly
Content-Type: application/json

{"sessionId":"155FB092B3BBCC0EBFC3C19DAB304DB8","count":1}

$ curl -i -b jar.txt http://localhost:8080/demo/visit
HTTP/1.1 200
Content-Type: application/json

{"sessionId":"155FB092B3BBCC0EBFC3C19DAB304DB8","count":2}

$ curl http://localhost:8080/demo/visit
{"sessionId":"C7083FCD22EBB433349E62118802C452","count":1}
```

| 본 것 | 뜻 |
|---|---|
| 첫 응답의 `Set-Cookie: JSESSIONID=…` | 서버가 세션을 만들고 그 번호표를 쿠키로 줬다 |
| `HttpOnly` | 페이지의 JS(`document.cookie`)가 이 쿠키를 못 읽는다. 스크립트로 훔쳐 가기 어렵게 |
| 두 번째(쿠키 보냄) `count: 2` | 같은 번호표 → 서버가 같은 세션을 찾았다 |
| 세 번째(쿠키 안 보냄) `count: 1` | 번호표가 없으니 서버 입장에선 처음 보는 사람. 새 세션 |

서버를 껐다 켠 뒤 **같은 쿠키**로 다시 보내면:

```text
$ curl -i -b jar.txt http://localhost:8080/demo/visit
HTTP/1.1 200
Set-Cookie: JSESSIONID=8AB29FEA9902DD3E50A8DAA7EED55EE8; Path=/; HttpOnly

{"sessionId":"8AB29FEA9902DD3E50A8DAA7EED55EE8","count":1}
```

세션은 서버 메모리에 있었으니 재시작하면 사라진다. 이게 로그인 상태였다면 모두 로그아웃된다. 서버를 여러 대 띄우면 "다른 서버의 메모리"에 있는 세션도 못 찾는다. 그래서 세션을 Redis 같은 바깥 저장소에 두거나, 토큰 방식을 쓴다.

### 토큰 — DB가 기억한다

이 실습은 로그인 기능 대신 **이미 발급된 토큰**을 `api_token` 테이블에 넣어 두었다.

```text
$ sql "SELECT t.token, t.member_id, m.nickname, m.member_status, t.expires_at, t.revoked_at FROM api_token t JOIN member m ON m.id = t.member_id WHERE t.id <= 7 ORDER BY t.id"
+---------------------+-----------+--------------+---------------+---------------------+---------------------+
| token               | member_id | nickname     | member_status | expires_at          | revoked_at          |
+---------------------+-----------+--------------+---------------+---------------------+---------------------+
| tok-admin           |         1 | 운영자       | ACTIVE        | 2099-12-31 23:59:59 | NULL                |
| tok-kimjava         |         2 | 김자바       | ACTIVE        | 2099-12-31 23:59:59 | NULL                |
| tok-lee             |         3 | 이스프링     | ACTIVE        | 2099-12-31 23:59:59 | NULL                |
| tok-park            |         4 | 박디비       | ACTIVE        | 2099-12-31 23:59:59 | NULL                |
| tok-kimjava-old     |         2 | 김자바       | ACTIVE        | 2026-01-01 00:00:00 | NULL                |
| tok-kimjava-revoked |         2 | 김자바       | ACTIVE        | 2099-12-31 23:59:59 | 2026-09-20 09:00:00 |
| tok-choi            |         5 | 최정지       | SUSPENDED     | 2099-12-31 23:59:59 | NULL                |
+---------------------+-----------+--------------+---------------+---------------------+---------------------+
```

1-6 정답 코드에 실제로 보낸 결과다(`BODY`는 평범한 글 하나).

```text
$ curl -i -X POST …/api/posts -H 'Content-Type: application/json' -H 'Authorization: Bearer tok-lee' -d "$BODY"
HTTP/1.1 201
Location: /api/posts/25

{"id":25,…,"author":{"id":3,"nickname":"이스프링"},…}

$ curl -i -X POST …/api/posts -H 'Content-Type: application/json' -d "$BODY"          # 헤더 없음
HTTP/1.1 401
WWW-Authenticate: Bearer
Content-Type: application/problem+json

{"detail":"인증이 필요합니다.","instance":"/api/posts","status":401,"title":"Unauthorized"}

$ curl -i -X POST … -H 'Authorization: Bearer tok-kimjava-old' -d "$BODY"           # 만료
HTTP/1.1 401
WWW-Authenticate: Bearer

$ curl -i -X POST … -H 'Authorization: Bearer tok-choi' -d "$BODY"                  # 정지 회원
HTTP/1.1 403
Content-Type: application/problem+json

{"detail":"정지되었거나 탈퇴한 회원입니다.","instance":"/api/posts","status":403,"title":"Forbidden"}
```

- 토큰이 없거나, `Bearer `로 시작하지 않거나(`Authorization: tok-kimjava`), 없는 토큰이거나, 만료·폐기면 모두 `401`이었다. 서버 입장에서는 전부 "누군지 증명 못 함"이다.
- `tok-choi`는 토큰 자체는 유효하다. 누군지(최정지)는 안다. 그런데 정지 회원이라 `403`이다.
- 작성자는 **토큰의 주인**이다. 본문에 `"authorId":1`을 넣어 `tok-kimjava`로 보내도 응답의 `author.id`는 `2`(김자바)였다. 클라이언트가 보낸 작성자 값을 믿으면 남의 이름으로 글을 쓸 수 있다.

## 따라 해 보기

10분. 실습 레포에서 한다.

**1. 세션을 직접 본다.** 위 `VisitController`를 `org.example.demo` 패키지에 만들고 서버를 켠다(경로가 `/api` 밖이라 다른 API와 섞이지 않는다). 예시의 curl 세 개를 그대로 보내 `count`가 `1 → 2 → 1`이 되는지 본다. 이어서 서버를 재시작하고 `curl -i -b jar.txt …`를 한 번 더 보내 `count`가 `1`로 돌아가는지 확인한다.

**2. 브라우저로 본다.** 브라우저에서 `http://localhost:8080/demo/visit`를 열고 새로고침한다. `count`가 올라간다. 개발자 도구 **Application → Cookies**에서 `JSESSIONID`와 `HttpOnly` 표시를 찾는다. 브라우저가 쿠키를 알아서 실어 보낸 것이다. 같은 탭의 Console에서 `document.cookie`를 쳐 보면 `''`(빈 문자열)이 나온다. `HttpOnly`라서 페이지의 JS에는 안 보인다.

**3. 토큰 표를 읽는다.** 예시의 `api_token` SELECT를 실행하고, 아래 토큰마다 1-6을 끝낸 서버가 몇을 돌려줘야 할지 먼저 적어 본다. `tok-park` · `tok-kimjava-revoked` · `tok-choi` · `Bearer` 없이 `tok-lee`. (정답은 1-6의 "만들 것" 표와 같다.)

**4. `VisitController`를 지운다.**

## 일부러 틀려 보기

**1. 쿠키를 안 실어 보낸다** — 예시의 세 번째 curl. 서버는 매번 새 사람으로 본다. "로그인했는데 다음 요청이 로그인 안 된 걸로 나온다"면, 쿠키 방식이면 요청에 `Cookie` 헤더가 실렸는지, 토큰 방식이면 `Authorization` 헤더가 실렸는지부터 본다.

**2. 로그에 토큰이 찍히는지 본다** — 1-6 정답 코드도 서버 로그를 보면 이런 줄이 있다.

```text
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (1:VARCHAR) <- [tok-kimjava-revoked]
```

내 코드가 아니라 E3에서 켠 **SQL 바인딩 로그**(`org.hibernate.orm.jdbc.bind: trace`)가 토큰을 조회하는 `?` 값을 찍은 것이다. 실습에서는 괜찮지만, 운영에서 이 로그를 켜 두면 토큰 원문이 로그 파일에 남는다. `Bearer` 토큰은 가진 사람이 곧 그 회원이다. 운영 설정에서는 이 줄을 끈다.

## 확인 문제

**1.** 다음 요청에 맞는 상태 코드는? ㉠ `Authorization` 헤더 없음 ㉡ `Bearer tok-kimjava-old`(만료) ㉢ `Bearer tok-choi`(정지 회원) ㉣ `Bearer tok-kimjava`로 공지 게시판에 쓰기

<details>
<summary>정답</summary>

㉠ `401` ㉡ `401` ㉢ `403` ㉣ `403`.

㉠㉡은 "누군지 증명 못 함"(인증 실패). ㉢㉣은 누군지는 알지만 할 수 없다(인가 실패). ㉢은 회원 상태, ㉣은 게시판 권한(`write_role = 'ADMIN'`) 때문이다.
</details>

**2.** 요청 본문에 `"authorId": 1`이 왔다. 서버가 이 값을 쓰지 않고 무시해야 하는 이유는?

<details>
<summary>정답</summary>

본문은 클라이언트가 마음대로 쓸 수 있다. 그 값을 작성자로 쓰면 `tok-kimjava`를 가진 사람이 운영자(1) 이름으로 글을 쓸 수 있다. 작성자는 서버가 **검증한 토큰의 주인**에서 정한다. 예시에서 `author.id`가 `2`로 나온 것이 그 결과다.
</details>

**3.** 서버를 재시작했다. 세션으로 로그인한 사용자와 `api_token` 토큰을 쓰는 사용자는 각각 어떻게 되나?

<details>
<summary>정답</summary>

- 세션: 세션이 서버 **메모리**에 있었으니 사라진다. 다시 로그인해야 한다(예시에서 같은 쿠키로 보냈는데 `count`가 `1`이 되고 새 `JSESSIONID`가 왔다).
- 토큰: 토큰은 **DB**(`api_token`)에 있으니 그대로 쓸 수 있다. 서버는 요청이 올 때마다 DB에서 찾아본다.
</details>

**4.** 토큰 없이 **깨진 JSON**을 보냈다. `400`과 `401` 중 무엇이 맞나? 왜?

<details>
<summary>정답</summary>

**`401`.** 인증이 먼저다. 누군지도 모르는 요청의 본문을 읽고 "형식이 틀렸다"고 친절히 알려 줄 이유가 없다. 1-6 정답 코드도 토큰 확인을 컨트롤러 매개변수(`@RequestBody`)를 만들기 **전** 단계(인터셉터)에서 해서 `401`을 돌려줬다(1-6 채점 C9).
</details>

**5.** 세 방식 중 "이 토큰을 지금 당장 못 쓰게 하라"가 가장 어려운 것은? 이유는?

<details>
<summary>정답</summary>

**JWT.** 서버가 저장소를 보지 않고 서명과 안에 적힌 만료 시각만 믿기 때문에, 만료 전까지는 유효하다. 막으려면 차단 목록을 따로 두고 매번 확인해야 한다(그러면 DB 조회형 토큰과 비슷해진다). 세션은 세션을 지우면 되고, DB 토큰은 `revoked_at`을 찍으면 된다(`tok-kimjava-revoked`가 그 예).
</details>

## 더 깊이

- [D11 웹 보안 기초 — 인증과 인가](../docs/knowledge/D11-web-security-basics.md#32-인증과-인가-신원-확인-후-객체까지-확인) — `401`과 `403`, 남의 글 고치기(IDOR)
- [B01 계정 생애주기](../docs/knowledge/B01-account-lifecycle.md) — 토큰·세션, 정지·탈퇴 회원 처리
- [S05 — 필터, 인터셉터, AOP 비교](../docs/knowledge/S05-mvc-request-flow.md#필터-인터셉터-aop-비교) — 토큰 확인을 어디에 둘까
- [W13 프론트와 백엔드의 경계](../docs/knowledge/W13-frontend-backend-boundary.md) — 클라이언트가 보낸 값을 믿으면 안 되는 이유
- [S12 Spring Security 아키텍처](../docs/knowledge/S12-security-architecture.md) · [S13 JWT·OAuth2](../docs/knowledge/S13-jwt-oauth2.md) — 실무에서 같은 일을 하는 표준 도구(심화)

## 다음

- 실습: [1-6. 토큰으로 작성자 정하기](../scenario/ch1-create-post/1-6-token-auth.md) — `Authorization: Bearer`를 한 곳에서 확인하고 `401`·`403`을 구분한다.
- 레슨: [F3. CORS](F3-cors.md) — 브라우저에서 보낸 요청만 막히는 이유. 1-6의 토큰 확인이 CORS를 망가뜨리는 함정도 여기서 본다.
