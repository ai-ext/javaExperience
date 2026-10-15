# F7. 권한과 역할 — 관리자·내 것만

> 개념 레슨 · 35분

## 이게 뭐냐

[F2](F2-auth-token.md)에서 서버는 토큰으로 **누가** 보냈는지 알아냈다. 그런데 누군지 안다고 다 해 줄 수는 없다.

- 회원 목록을 보는 운영 API는 **운영자만** 불러야 한다.
- 메모 `2`번은 그 메모를 쓴 사람**만** 봐야 한다.

첫째는 **역할**(role)을 묻는 검사, 둘째는 **소유자**(owner)를 묻는 검사다. 둘 다 "이 사람이 이 일을 해도 되나"를 정하는 **인가**(authorization)다. 토큰으로 누군지 알아내는 **인증**(authentication)과는 다른 단계다.

| 단계 | 묻는 것 | 실패하면 |
|---|---|---|
| 인증 | 누구냐? (토큰이 있고 맞나) | `401 Unauthorized` + `WWW-Authenticate` 헤더 |
| 인가 — 역할 | 이 **기능**을 쓸 수 있나 | `403 Forbidden` |
| 인가 — 소유자 | 이 **데이터**에 손댈 수 있나 | `404`(있다는 것도 숨김) 또는 `403` |

`401`의 이름은 Unauthorized지만 뜻은 "인증이 안 됐다"다. 이름에 속지 않는다. 누군지 모르면 `401`, 누군지는 아는데 안 되면 `403`이다. 소유자 검사에서 `404`를 쓰는 이유는 [G2](G2-access-rules-in-one-place.md)에서 봤다. 남의 메모에 `403`을 주면 "그 번호의 메모가 있긴 하다"를 알려 주는 셈이다.

### 역할은 `member.role` 한 칸

practice DB의 회원 테이블에 이미 있다.

```text
role VARCHAR(20) NOT NULL DEFAULT 'USER',
CONSTRAINT ck_member_role CHECK (role IN ('USER','ADMIN'))
```

회원 1(`tok-p01`)은 `ADMIN`, 회원 2(`tok-p02`)는 `USER`다. 역할은 **서버가 DB에서 읽은 값**만 믿는다. 가입·프로필 수정 요청 본문에 `"role": "ADMIN"`이 들어 있어도 저장하지 않는다. 그걸 받아 주면 누구나 스스로 운영자가 된다.

### 어디서 검사하나 — 인터셉터 두 개

1-6에서 토큰을 확인하는 `AuthInterceptor`를 만들었다. 컨트롤러 메서드가 실행되기 **전에** 도는 `HandlerInterceptor`의 `preHandle`이다. 역할 검사도 같은 자리에 하나 더 둔다.

```text
요청 → AuthInterceptor(누구냐 → 요청 속성에 회원을 넣음)
     → AdminOnlyInterceptor(@AdminOnly가 붙었나 → 붙었으면 ADMIN인가)
     → 컨트롤러
```

**순서가 중요하다.** 역할을 보려면 회원이 먼저 있어야 한다. 아래 "일부러 틀려 보기"에서 순서를 바꿔 본다.

소유자 검사는 인터셉터가 못 한다. 인터셉터는 "메모 2번의 주인이 누구인지" 모른다. 데이터를 읽는 자리, 즉 **SQL의 `WHERE`** 에서 한다.

## 예시

이 레슨을 쓰면서 작은 Spring Boot 4.1.1 앱을 practice DB에 붙여 띄웠다. 토큰과 회원은 practice DB의 `api_token`·`member`를 읽고, 메모는 연습용 테이블 `lesson_f7_memo`에 두 줄 넣었다(1번은 회원 2의 것, 2번은 회원 3의 것).

### ① `@AdminOnly` — 직접 만드는 표시

```java
// 이 표시가 붙은 컨트롤러·메서드는 ADMIN만 부를 수 있다
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface AdminOnly {}
```

B8에서 봤듯 어노테이션은 표시일 뿐이다. 읽는 쪽이 있어야 일이 생긴다. 읽는 쪽이 인터셉터다.

```java
@Component
public class AdminOnlyInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod method)) return true;     // 컨트롤러 메서드가 아니면 통과
        boolean adminOnly = method.hasMethodAnnotation(AdminOnly.class)
                || method.getBeanType().isAnnotationPresent(AdminOnly.class);
        if (!adminOnly) return true;                                      // 표시 없으면 통과

        AuthenticatedMember me = (AuthenticatedMember) request.getAttribute(AuthInterceptor.LOGIN_MEMBER_ATTRIBUTE);
        if (me == null) throw new AuthenticationRequiredException("인증이 필요합니다.");    // → 401
        if (!"ADMIN".equals(me.role())) throw new ForbiddenException("관리자만 할 수 있습니다.");  // → 403
        return true;
    }
}

@AdminOnly                       // 클래스에 붙이면 안의 메서드 전부
@RestController
@RequestMapping("/f7/admin")
class AdminController {
    @GetMapping("/members")
    public List<Map<String, Object>> members() { … }
}
```

등록은 `WebMvcConfigurer`에서 **인증 다음 줄**에 한다.

```java
registry.addInterceptor(auth).addPathPatterns("/f7/**");        // 1. 누구냐
registry.addInterceptor(adminOnly).addPathPatterns("/f7/**");   // 2. 해도 되나
```

인터셉터에서 던진 예외도 `@RestControllerAdvice`가 잡는다. `401` 처리기는 `WWW-Authenticate: Bearer` 헤더를 붙인다.

### ② 같은 API, 세 사람

```text
# 토큰 없음
HTTP/1.1 401
WWW-Authenticate: Bearer
Content-Type: application/problem+json

{"detail":"인증이 필요합니다.","instance":"/f7/admin/members","status":401,"title":"Unauthorized"}

# tok-p02 (USER)
HTTP/1.1 403
Content-Type: application/problem+json

{"detail":"관리자만 할 수 있습니다.","instance":"/f7/admin/members","status":403,"title":"Forbidden"}

# tok-p01 (ADMIN)
HTTP/1.1 200

[{"id":1,"nickname":"운영자","role":"ADMIN"},{"id":2,"nickname":"코딩하는고양이","role":"USER"},{"id":3,"nickname":"자바초보탈출","role":"USER"}]
```

없는 토큰(`tok-nope`)은 `"유효하지 않은 토큰입니다."`로 `401`이었다. 토큰이 틀린 것도 "누군지 모른다"다.

### ③ IDOR — 번호만 바꿔 남의 것 보기

메모 조회를 이렇게 만들었다고 하자. 토큰 검사는 통과해야 들어온다.

```java
@GetMapping("/memos/{id}")
public Map<String, Object> get(@PathVariable long id) {
    List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT id, owner_id, body FROM lesson_f7_memo WHERE id = ?", id);
    if (rows.isEmpty()) throw new MemoNotFoundException(id);
    return rows.get(0);
}
```

회원 2(`tok-p02`)가 자기 메모 1번을 본 다음, 주소의 숫자만 `2`로 바꿨다.

```text
$ curl -s localhost:18290/f7/memos/1 -H 'Authorization: Bearer tok-p02'
{"id":1,"owner_id":2,"body":"고양이 비밀 메모: 다음 주 이직 면접"}

$ curl -s -i localhost:18290/f7/memos/2 -H 'Authorization: Bearer tok-p02'
HTTP/1.1 200

{"id":2,"owner_id":3,"body":"자바초보 메모: 비밀번호 힌트는 생일"}
```

회원 3의 메모가 그대로 나왔다. 로그인도 했고, 토큰도 맞다. **인증은 완벽한데 인가가 없다.** 주소나 본문에 든 id만 바꿔 남의 데이터에 닿는 구멍을 **IDOR**(Insecure Direct Object Reference)라고 부른다. 수정도 똑같다.

```text
$ curl -s -X PATCH localhost:18290/f7/memos/2 -H 'Authorization: Bearer tok-p02' \
    -H 'Content-Type: application/json' -d '{"body":"고양이가 고침"}'
{"updated":1}

mysql> SELECT * FROM lesson_f7_memo;
+----+----------+---------------------------------------------------+
| id | owner_id | body                                              |
+----+----------+---------------------------------------------------+
|  1 |        2 | 고양이 비밀 메모: 다음 주 이직 면접               |
|  2 |        3 | 고양이가 고침                                     |
+----+----------+---------------------------------------------------+
```

### ④ 막기 — `WHERE`에 주인을 넣는다

"그 번호의 메모"가 아니라 **"내 메모 중 그 번호"** 를 찾는다. 주인 id는 요청 본문이 아니라 인터셉터가 토큰으로 찾아 둔 회원에서 꺼낸다.

```java
@GetMapping("/safe/memos/{id}")
public Map<String, Object> getSafe(@PathVariable long id, HttpServletRequest req) {
    AuthenticatedMember me = (AuthenticatedMember) req.getAttribute(AuthInterceptor.LOGIN_MEMBER_ATTRIBUTE);
    List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT id, owner_id, body FROM lesson_f7_memo WHERE id = ? AND owner_id = ?", id, me.id());
    if (rows.isEmpty()) throw new MemoNotFoundException(id);   // 없거나, 내 것이 아니거나
    return rows.get(0);
}

// 수정도 같다 — 바뀐 줄이 0이면 404
int updated = jdbc.update("UPDATE lesson_f7_memo SET body = ? WHERE id = ? AND owner_id = ?",
        body.get("body"), id, me.id());
```

```text
# tok-p02 → 메모 2 (남의 것)
HTTP/1.1 404
{"detail":"메모를 찾을 수 없습니다: 2","instance":"/f7/safe/memos/2","status":404,"title":"Not Found"}

# tok-p02 → 메모 999 (없는 것)
{"detail":"메모를 찾을 수 없습니다: 999","instance":"/f7/safe/memos/999","status":404,"title":"Not Found"}

# tok-p02 → 메모 1 (내 것)
{"id":1,"owner_id":2,"body":"고양이 비밀 메모: 다음 주 이직 면접"}
```

남의 것과 없는 것이 **똑같은 응답**이다. 바깥에서는 "남의 메모가 있다"를 알 수 없다. `PATCH /f7/safe/memos/2`도 `404`였고, DB의 2번 메모는 바뀌지 않았다.

글처럼 "누구나 보지만 고치는 건 작성자만"인 데이터는 G2의 순서대로 한다. 먼저 볼 수 있나(아니면 `404`), 그다음 고칠 수 있나(아니면 `403`). 3-1의 `PATCH`가 그 모양이다.

## 따라 해 보기

10분. 이 레슨의 실험 앱 대신, 3-2까지 끝낸 실습 레포(시나리오 DB `community`)에서 **두 토큰으로** IDOR를 찾아본다. 시나리오 토큰은 `tok-kimjava`(김자바), `tok-lee`(이스프링), `tok-admin`(운영자)이다.

**1. 내 것을 하나 만든다.** `tok-kimjava`로 글을 하나 쓰고 응답의 `id`를 적는다(여기서는 `N`).

**2. 남의 토큰으로 건드린다.** `tok-lee`로 같은 글을 고치고 지워 본다.

```bash
curl -s -i -X PATCH http://localhost:8080/api/posts/N -H 'Authorization: Bearer tok-lee' \
  -H 'Content-Type: application/json' -d '{"title":"남이 고침"}'
curl -s -i -X DELETE http://localhost:8080/api/posts/N -H 'Authorization: Bearer tok-lee'
```

[3-1](../scenario/ch3-update-delete/3-1-patch.md)·[3-2](../scenario/ch3-update-delete/3-2-soft-delete.md)의 규칙대로라면 둘 다 `403`이어야 한다. `200`·`204`가 나오면 그 API에 소유자 검사가 없다.

**3. 운영자 토큰으로 지운다.** `tok-admin`으로 같은 `DELETE`를 보낸다. 3-2의 규칙(작성자 또는 운영자)대로라면 지워진다. 역할 검사와 소유자 검사가 **둘 중 하나만 맞으면 되는** 경우다.

## 일부러 틀려 보기

**1. 인터셉터 순서를 바꾼다** — `adminOnly`를 먼저, `auth`를 다음에 등록하고 운영자 토큰으로 불렀다.

```text
$ curl -s -i localhost:18290/f7/admin/members -H 'Authorization: Bearer tok-p01'
HTTP/1.1 401
WWW-Authenticate: Bearer

{"detail":"인증이 필요합니다.","instance":"/f7/admin/members","status":401,"title":"Unauthorized"}
```

토큰이 맞는 **운영자가** `401`을 받았다. 역할 검사가 돌 때 아직 아무도 요청 속성에 회원을 넣지 않았다. `@AdminOnly`가 없는 메모 API는 그대로 `200`이라 "일부 API만 이상하다"로 보인다. 13-1의 채점 R2("`AuthInterceptor` 다음에 돈다")가 이것이다.

**2. 소유자 검사를 컨트롤러 한 곳에만 넣는다** — 조회는 `getSafe`로 고치고 수정은 예전 `PATCH /f7/memos/{id}`를 그대로 두면, 보지는 못하는 메모를 고칠 수는 있다(③의 `{"updated":1}`). 소유자 검사는 **id로 데이터에 닿는 모든 길**에 있어야 한다. G2가 규칙을 한 클래스에 모으라고 한 이유다.

**3. 요청 본문의 주인 id를 믿는다** — `{"ownerId": 3, "body": "…"}`처럼 받은 `ownerId`로 `WHERE owner_id = ?`를 채우면, 그 값을 바꿔 보내는 것만으로 ③과 같은 구멍이 다시 열린다. 주인 id는 토큰에서 찾은 회원에서만 꺼낸다.

## 확인 문제

**1.** 각 상황의 응답 코드는? ㉠ 토큰 없이 운영 API ㉡ `USER` 토큰으로 운영 API ㉢ 만료된 토큰으로 내 글 조회

<details>
<summary>정답</summary>

㉠ `401`(누군지 모름, `WWW-Authenticate` 헤더 포함) ㉡ `403`(누군지는 아는데 역할이 안 됨) ㉢ `401`(토큰이 유효하지 않으면 누군지 모르는 것이다 — 내 글이라도 마찬가지).
</details>

**2.** 메모 조회 SQL이 `WHERE id = ?`뿐이다. 로그인한 회원만 부를 수 있으니 안전한가?

<details>
<summary>정답</summary>

**아니다.** 로그인은 인증이고, "이 메모를 봐도 되나"는 인가다. 로그인한 아무나 숫자만 바꿔 남의 메모를 본다(③). `WHERE id = ? AND owner_id = ?`처럼 내 것 중에서 찾는다.
</details>

**3.** 메모 id를 `1, 2, 3` 대신 추측하기 어려운 UUID로 바꾸면 소유자 검사를 빼도 되나?

<details>
<summary>정답</summary>

**안 된다.** UUID는 맞히기 어렵게 할 뿐이다. 링크 공유·로그·브라우저 기록으로 한 번 알려진 UUID는 그대로 쓸 수 있다. 소유자 검사가 있어야 막힌다. 추측하기 어려운 id는 덤이다.
</details>

**4.** 남의 메모에 `403` 대신 `404`를 주는 이유는?

<details>
<summary>정답</summary>

`403`은 "그 번호의 메모가 **있는데** 네 것이 아니다"를 알려 준다. 번호를 하나씩 넣어 보며 남의 메모가 몇 번에 있는지 알아낼 수 있다. `404`면 없는 것과 남의 것이 구별되지 않는다(④). 다만 "볼 수는 있는데 고칠 수 없는" 글은 이미 있는 걸 아니까 `403`이다(G2).
</details>

**5.** 가입 API가 요청 DTO를 그대로 `Member`로 바꿔 저장한다. 공격자가 본문에 `"role":"ADMIN"`을 넣으면?

<details>
<summary>정답</summary>

DTO나 엔티티에 `role`이 있다면 그대로 저장돼 **스스로 운영자가 된다.** 가입 요청 DTO에는 `role`을 아예 두지 않고, 기본 역할은 서버가 `USER`로 정한다. 역할 바꾸기는 13-1처럼 운영자만 부를 수 있는 따로 된 API로 한다.
</details>

## 더 깊이

- [D11 — 인증과 인가: 신원 확인 후 객체까지 확인](../docs/knowledge/D11-web-security-basics.md#32-인증과-인가-신원-확인-후-객체까지-확인) · [안전한 SQL 바인딩과 IDOR 방어](../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기) · [Q4. UUID로 바꾸면 왜 충분하지 않나](../docs/knowledge/D11-web-security-basics.md#q4-idor를-식별자-uuid로-바꾸면-왜-충분하지-않나)
- [S05 — 필터, 인터셉터, AOP 비교](../docs/knowledge/S05-mvc-request-flow.md#필터-인터셉터-aop-비교) — 인터셉터는 `HandlerMapping` 뒤에서 돈다
- [S12 Spring Security 구조](../docs/knowledge/S12-security-architecture.md) — 실무에서는 `SecurityFilterChain`의 `hasRole("ADMIN")`, 메서드의 `@PreAuthorize`(켜려면 `@EnableMethodSecurity`)가 같은 일을 한다
- 원문: [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — 기본은 거부, 요청마다 서버에서 · [OWASP IDOR Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html) · [RFC 9110 — 401](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) · [403](https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden) · [Spring Framework — Interceptors](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html) — 인터셉터를 보안 경계로 쓸 때의 주의 · [Spring Security — Authorize HttpServletRequests](https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html) · [Method Security](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)

## 다음

- 실습: [13-1. 운영 역할 — 모더레이터와 글 숨김·복구](../scenario/ch13-operations/13-1-roles-and-hide.md) — 오늘의 `@AdminOnly`를 역할 → 권한 표(`@RequirePermission`)로 키우고, `MODERATOR`를 더한다.
- 실습: [13-3. 작성자 기간 정지](../scenario/ch13-operations/13-3-member-suspension.md) — 운영자만 부르는 API, 그리고 정지된 회원의 쓰기를 `403`으로 막는다.
- 레슨: [F8. 요청 수 제한](F8-rate-limiting.md) — 자격은 있는데 **너무 자주** 오는 요청(`429`).
