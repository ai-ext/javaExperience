# A5. REST API 설계와 명세서 읽기

> 개념 레슨 · 35분

## 이게 뭐냐

API 문서는 "글 목록은 `GET /api/posts`, 글 쓰기는 `POST /api/posts`, 성공하면 201" 같은 표다. 클라이언트를 만드는 사람은 이 표만 보고 요청을 짠다. 이번에는 그 표를 **만드는 쪽**, 그리고 받은 표를 보고 **서버 코드로 옮기는 쪽**이다.

메서드·URL·상태 코드가 각각 무엇인지는 [A2](./A2-http-anatomy.md)에서 봤다. 여기서는 "그중 **무엇을 고르나**"를 다룬다. REST는 그 고르는 방식에 붙은 이름이다. 핵심은 두 줄이다.

- **URL은 명사(무엇)** — 다루는 대상(자원, resource)을 가리킨다.
- **메서드는 동사(무엇을 할지)** — 그 대상에 무엇을 하는지는 `GET`·`POST`·`PUT`·`DELETE`가 말한다.

### 자원과 URL

| 하려는 일 | 이렇게 | 이렇게 하지 않는다 |
|---|---|---|
| 글 목록 | `GET /api/v1/posts` | `GET /api/v1/getPosts` |
| 글 하나 | `GET /api/v1/posts/7` | `GET /api/v1/post?id=7` |
| 글 쓰기 | `POST /api/v1/posts` | `POST /api/v1/posts/create` |
| 글 지우기 | `DELETE /api/v1/posts/7` | `GET /api/v1/posts/delete/7` |
| 7번 글의 댓글 목록 | `GET /api/v1/posts/7/comments` | `GET /api/v1/comments?postId=7`도 틀린 건 아니다. 댓글이 글에 **속한다**는 관계가 분명하면 경로로 잇는다 |

- 모음은 복수형(`posts`), 그 안의 하나는 뒤에 id(`posts/7`). 정렬·검색·페이지 같은 **조건**은 쿼리(`?sort=latest&page=0`)로 붙인다(A2, 페이지는 [G1](./G1-paging-and-sorting.md)).
- 글 지우기 줄의 `GET .../delete/7`이 특히 위험하다. `GET`은 "읽기만 한다"는 약속이라 브라우저·링크 미리보기·크롤러가 마음대로 보낸다. 그 주소가 글을 지우면 아무도 누르지 않았는데 글이 사라진다.
- 실무 명세에는 동사 같은 경로도 나온다. 10장의 `POST /api/v1/auth/login`(로그인), `POST /api/v1/posts/{postId}/like`(좋아요 토글)가 그렇다. 딱 떨어지는 자원이 없는 동작이다. 이때도 **상태를 바꾸면 `GET`이 아니다**는 지킨다.
- `/api/v1`의 `v1`은 "계약 1판"이다. 이미 쓰는 클라이언트를 깨는 변경은 `v2`를 새로 열어 나란히 둔다(10-11). 경로에 버전을 넣는 건 표준이 아니라 흔한 선택 중 하나다.

### 안전과 멱등 — 다시 보내도 되나

네트워크가 끊겨 응답을 못 받으면 클라이언트는 다시 보내고 싶다. 사용자가 버튼을 두 번 누르기도 한다. 그때 "다시 보내도 괜찮은가"를 메서드가 미리 약속한다(RFC 9110).

| 메서드 | 안전(서버 상태를 안 바꿈) | 멱등(여러 번 보내도 한 번 보낸 것과 같은 상태) | 재시도 |
|---|---|---|---|
| `GET`·`HEAD`·`OPTIONS` | 예 | 예 | 마음 놓고 |
| `PUT` | 아니오 | **예** — "이 내용으로 바꿔라"는 몇 번을 해도 결과가 같다 | 해도 된다 |
| `DELETE` | 아니오 | **예** — 지운 걸 또 지워도 지워진 상태 | 해도 된다 |
| `POST` | 아니오 | **아니오** — 보낼 때마다 새로 만든다 | 조심 |
| `PATCH` | 아니오 | 보장 안 함 — `likeCount + 1` 같은 패치는 보낼 때마다 늘어난다 | 명세를 보고 |

멱등은 **서버 상태**에 대한 약속이다. 응답이 매번 같다는 뜻이 아니다. 아래 예시에서 `DELETE`를 두 번 보내면 첫 번째는 `204`, 두 번째는 `404`다. 그래도 "글이 없는 상태"는 같으니 멱등이다.

### 성공 상태 코드 고르기

| 작업 | 성공 코드 | 같이 줄 것 |
|---|---|---|
| 조회·수정 | `200 OK` | 본문에 결과 |
| 새로 만듦 | `201 Created` | `Location` 헤더에 **새로 만든 것의 주소**, 보통 본문에도 결과 |
| 했는데 돌려줄 게 없음(삭제 등) | `204 No Content` | 본문 없음 |

10장 명세는 삭제 성공을 `204`가 아니라 `200` + `data: null`로 정했다. 모든 응답을 같은 틀(`{status, message, data}`)로 감싸기로 했기 때문이다([10-2](../scenario/ch10-project/10-2-common-response.md)). 어느 쪽도 HTTP 위반이 아니다. **명세서에 적힌 대로** 한다.

### 실패 상태 코드 고르기

| 상황 | 코드 |
|---|---|
| 본문·파라미터를 읽을 수 없거나 규칙 위반 | `400` |
| 누군지 증명 못 함(토큰 없음·틀림·만료) | `401`([F2](./F2-auth-token.md)) |
| 누군지는 아는데 권한이 없음 | `403` |
| 대상이 없음. 남의 비공개 글처럼 **있는지조차 알려 주면 안 될 때**도 | `404`(10장의 `PRIVATE`) |
| 지금 상태와 부딪힘(이미 가입된 이메일 등) | `409` |

둘 이상에 걸리면 무엇이 먼저인지도 명세가 정한다. 10장은 토큰이 필요한 주소에 토큰 없이 오면 본문이 깨져 있어도 `401`이다. 누군지 모르는 요청의 본문까지 읽어 줄 이유가 없다(F2 확인 문제 4).

- 검증 실패에 `422`를 쓰는 API도 있다. "문법은 맞는데 내용을 처리할 수 없다"는 뜻이다. `400`과 `422` 중 무엇을 쓸지는 정답이 없고, 한 API 안에서 **한 가지로 일관되게** 정한다. 10장은 `400`이다.
- 실패 **본문의 모양**도 약속이다. 표준 형식 `ProblemDetail`([F1](./F1-validation-errors.md))과 팀이 정한 공통 틀(10-2)이 흔하다. 어느 쪽이든 클라이언트는 문장(`message`)이 아니라 **코드 값**(`type`·`code`)으로 분기한다.

### 명세서 읽기 — 표와 OpenAPI

회사 명세서는 두 모양으로 온다. 하나는 10-1 같은 **표**다. 다른 하나는 **OpenAPI**(Swagger) 문서다. 같은 약속을 기계가 읽을 수 있게 YAML로 적은 것이다. Swagger UI 화면은 이 문서를 보기 좋게 그린 것이다.

```yaml
paths:
  /api/v1/users:
    post:
      summary: 회원 가입
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SignupRequest'
      responses:
        '201':
          description: 가입됨
          headers:
            Location:
              schema: { type: string }
        '400': { description: 입력 규칙 위반 }
        '409': { description: 이메일 중복 }
  /api/v1/posts/{postId}:
    get:
      parameters:
        - { name: postId, in: path, required: true, schema: { type: integer, format: int64 } }
      responses:
        '200': { description: 글 상세 }
        '404': { description: 없음·삭제·남의 비공개 글 }
components:
  schemas:
    SignupRequest:
      type: object
      required: [email, password, nickname]
      properties:
        email: { type: string, format: email }
        password: { type: string, minLength: 8, maxLength: 64 }
        nickname: { type: string, minLength: 2, maxLength: 20 }
```

| 명세서에서 | Spring 코드로 |
|---|---|
| `paths`의 주소 + `post:`·`get:` | `@PostMapping("/api/v1/users")`·`@GetMapping("/api/v1/posts/{postId}")` |
| `in: path` | `@PathVariable Long postId` (`int64` = `long`) |
| `in: query` | `@RequestParam` |
| `in: header` | `@RequestHeader("X-Client")` |
| `requestBody` + `schema`(`$ref`면 `components`로 따라간다) | `@RequestBody SignupRequest request` — record 하나 |
| `required`·`minLength`·`maxLength` | 검증 어노테이션(`@NotNull`·`@Size`, F1) |
| `responses`의 `'201'` + `Location` | `ResponseEntity.created(주소).body(...)` |
| `responses`의 `'400'`·`'409'` | 예외 처리 — **성공만 만들면 반쯤 만든 것이다** |

표 모양 명세(10-1)도 읽는 법이 같다. 왼쪽부터 **요청 → 규칙 → 성공 → 실패**. 실패 칸의 숫자마다 "어떤 입력이면 이 숫자인가"를 한 줄씩 말해 본다. 그 목록이 곧 직접 확인할 항목이다.

## 예시

글 자원 하나로 메서드·상태 코드·`Location`·멱등을 직접 본다. 저장은 메모리라 서버를 끄면 사라진다. Boot 4.1.1에서 실행했다.

```java
package org.example.lesson;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

// 연습용 — 글 자원 하나로 메서드·상태 코드·Location·멱등을 본다. 다 보면 지운다
@RestController
@RequestMapping("/api/lesson/a5/posts")
public class PostLessonController {

    public record PostRequest(String title, String content) {
    }

    public record PostResponse(Long id, String title, String content) {
    }

    private final Map<Long, PostResponse> posts = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong();

    // 만들기 — 201 + Location(새 글의 주소). 10장처럼 경로만 넣었다
    @PostMapping
    public ResponseEntity<PostResponse> create(@RequestBody PostRequest request) {
        long id = sequence.incrementAndGet();
        PostResponse saved = new PostResponse(id, request.title(), request.content());
        posts.put(id, saved);
        return ResponseEntity.created(URI.create("/api/lesson/a5/posts/" + id)).body(saved);
    }

    @GetMapping("/{id}")
    public PostResponse get(@PathVariable Long id) {
        PostResponse post = posts.get(id);
        if (post == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "글이 없습니다.");
        }
        return post;
    }

    // 통째로 바꾸기 — 보낸 그대로가 새 상태
    @PutMapping("/{id}")
    public PostResponse replace(@PathVariable Long id, @RequestBody PostRequest request) {
        if (!posts.containsKey(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "글이 없습니다.");
        }
        PostResponse replaced = new PostResponse(id, request.title(), request.content());
        posts.put(id, replaced);
        return replaced;
    }

    // 지우기 — 204(본문 없음). 없으면 404
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (posts.remove(id) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "글이 없습니다.");
        }
        return ResponseEntity.noContent().build();
    }
}
```

아래는 실제 응답이다. `Date` 등 일부 헤더는 뺐다. `…`는 서버 주소다(실측은 `http://localhost:18150`, 여러분 앱은 `http://localhost:8080`).

```text
$ curl -i -X POST …/api/lesson/a5/posts -H 'Content-Type: application/json' -d '{"title":"첫 글","content":"안녕"}'
HTTP/1.1 201
Location: /api/lesson/a5/posts/1
{"id":1,"title":"첫 글","content":"안녕"}
$ (같은 요청을 한 번 더)
HTTP/1.1 201
Location: /api/lesson/a5/posts/2
{"id":2,"title":"첫 글","content":"안녕"}
$ curl -i -X PUT …/api/lesson/a5/posts/1 -H 'Content-Type: application/json' -d '{"title":"고친 제목","content":"고친 내용"}'
HTTP/1.1 200
{"id":1,"title":"고친 제목","content":"고친 내용"}
$ (같은 PUT을 한 번 더)
HTTP/1.1 200
{"id":1,"title":"고친 제목","content":"고친 내용"}
$ curl -i -X DELETE …/api/lesson/a5/posts/2
HTTP/1.1 204
$ (같은 DELETE를 한 번 더)
HTTP/1.1 404
{"timestamp":"2026-10-10T01:42:08.028Z","status":404,"error":"Not Found","path":"/api/lesson/a5/posts/2"}
```

| 본 것 | 뜻 |
|---|---|
| `POST` 두 번 → id 1, 2 | 같은 본문인데 글이 **두 개**. 재시도하면 중복 글이 생긴다 |
| `PUT` 두 번 → 같은 결과 | 두 번째는 아무것도 바꾸지 않았다. 멱등 |
| `DELETE` 두 번 → `204`, `404` | 응답은 달라도 "2번 글 없음" 상태는 같다. 멱등 |

10장의 좋아요 토글(`POST .../like`)은 두 번 보내면 "눌렀다 → 취소"가 된다. 멱등이 아니다. 그래서 10-11에서 `PUT`(누름)·`DELETE`(취소)로 바꾼다. 그 단계는 두 번째 `DELETE`도 `200`으로 답하게 정했다. 두 번째 `DELETE`를 `404`로 할지 `200`·`204`로 할지는 **명세가 정한다**.

`OPTIONS`를 보내면 그 주소가 받는 메서드를 알려 준다.

```text
$ curl -i -X OPTIONS …/api/lesson/a5/posts
HTTP/1.1 200
Allow: POST,OPTIONS
$ curl -i -X OPTIONS …/api/lesson/a5/posts/1
HTTP/1.1 200
Allow: GET,HEAD,PUT,DELETE,OPTIONS
```

모음 주소에는 `GET`을 만들지 않아서 `POST`만 나온다. `HEAD`·`OPTIONS`는 내가 만들지 않았는데 Spring이 알아서 받는다(`GET`이 있는 주소는 `HEAD`도 받는다. 같은 헤더에 본문만 뺀 것). 브라우저도 `OPTIONS`를 보낸다. 다른 출처에서 `PUT`·`Authorization`을 보내기 전에 미리 묻는 preflight다([F3](./F3-cors.md)).

## 따라 해 보기

15분.

1. javaExperience의 `org.example.lesson` 패키지(B3에서 만든 곳)에 `PostLessonController.java`를 넣고 앱을 띄운다.
2. 예시의 curl을 차례로 보낸다(`…` 자리에 `http://localhost:8080`). `POST`·`PUT`·`DELETE`를 **두 번씩** 보내 표와 같은지 본다.
3. `curl -i -X OPTIONS …/api/lesson/a5/posts/1`로 `Allow`를 본다.
4. [10-1의 엔드포인트 표](../scenario/ch10-project/10-1-new-project.md#3-엔드포인트)에서 `DELETE /api/v1/posts/{postId}` 줄을 골라 적어 본다 — Spring 어노테이션 두 개, 성공 코드와 본문, 실패 코드마다 "어떤 요청이면", 두 번 보내면 두 번째 응답. 정답은 확인 문제 5 아래에 있다.

5. `PostLessonController`를 지운다.

## 일부러 틀려 보기

### ① PUT에 바꿀 칸만 보낸다

"제목만 고치고 싶다"며 `PUT`에 `title`만 보낸다.

```text
$ curl -i -X PUT …/api/lesson/a5/posts/1 -H 'Content-Type: application/json' -d '{"title":"제목만"}'
HTTP/1.1 200
{"id":1,"title":"제목만","content":null}
```

에러가 없는데 본문(`content`)이 사라졌다. `PUT`은 **통째로 바꾸기**라 안 보낸 칸은 빈 값이 된다. 10장 명세도 "전체 교체 — 빠진 필드는 기본값"이라고 적었다. 일부만 바꾸는 API가 필요하면 `PATCH`로 따로 약속한다. 클라이언트는 `PUT`을 보낼 때 **모든 칸**을 담아야 한다.

### ② 경로 변수에 글자를 넣는다

```text
$ curl -i …/api/lesson/a5/posts/abc
HTTP/1.1 400
{"timestamp":"…","status":400,"error":"Bad Request","path":"/api/lesson/a5/posts/abc"}
(서버 로그)
WARN … Resolved [org.springframework.web.method.annotation.MethodArgumentTypeMismatchException: Method parameter 'id': Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long'; For input string: "abc"]
```

`{id}`를 `Long`으로 받기로 했으니 `abc`는 "요청이 잘못됐다"(`400`)다. `404`가 아니다. 주소 모양은 맞지만 값이 틀렸다. 내 메서드가 불리기 **전**에 Spring이 거절해서 내 코드 줄은 로그에 없다.

## 확인 문제

**1.** 10장 댓글 기능을 URL과 메서드로 설계하라. ㉠ 7번 글의 댓글 목록 ㉡ 7번 글에 댓글 쓰기 ㉢ 30번 댓글 지우기

<details>
<summary>정답</summary>

㉠ `GET /api/v1/posts/7/comments` ㉡ `POST /api/v1/posts/7/comments` ㉢ `DELETE /api/v1/comments/30`.

댓글은 글에 속하니 목록·작성은 글 아래 경로로 잇는다. 지울 때는 댓글 id만으로 대상이 정해지니 `/comments/30`이면 충분하다. 10장 명세가 이 모양이다. 동사(`create`·`delete`)는 경로가 아니라 메서드에 있다.
</details>

**2.** 클라이언트가 보낸 요청이 타임아웃 났다. 서버에 갔는지 모른다. `PUT /api/v1/posts/7`과 `POST /api/v1/posts` 중 그냥 다시 보내도 되는 것은? 이유는?

<details>
<summary>정답</summary>

**`PUT`.** 멱등이라 첫 요청이 이미 처리됐어도 같은 내용으로 한 번 더 바꿀 뿐이다. `POST`는 첫 요청이 처리됐다면 글이 하나 더 생긴다(예시의 id 1, 2). `POST`를 안전하게 재시도하려면 서버가 "같은 요청"을 알아보는 장치(예: `Idempotency-Key` 헤더)를 따로 약속해야 한다.
</details>

**3.** 같은 `DELETE`를 두 번 보냈더니 `204` 다음에 `404`가 왔다. "응답이 다르니 멱등이 아니다"라는 말은 맞나?

<details>
<summary>정답</summary>

틀렸다. 멱등은 **서버 상태**에 대한 약속이다. 두 번 보낸 뒤에도 "그 글이 없다"는 상태는 한 번 보낸 것과 같다. 응답 코드는 달라도 된다. 두 번째를 `404`로 할지 `200`·`204`로 할지는 명세가 정한다(10-11은 `200`).
</details>

**4.** OpenAPI에 아래가 있다. Spring 메서드의 매개변수 세 개를 적어라.

```yaml
/api/v1/posts/{postId}/comments:
  get:
    parameters:
      - { name: postId, in: path, required: true, schema: { type: integer, format: int64 } }
      - { name: size, in: query, required: false, schema: { type: integer } }
      - { name: X-Client, in: header, required: false, schema: { type: string } }
```

<details>
<summary>정답</summary>

```java
@GetMapping("/api/v1/posts/{postId}/comments")
public ... list(@PathVariable Long postId,
                @RequestParam(required = false) Integer size,
                @RequestHeader(value = "X-Client", required = false) String client)
```

`in`이 값이 올 **자리**를 말한다. `path` → `@PathVariable`, `query` → `@RequestParam`, `header` → `@RequestHeader`. `required: false`이면 빠져도 되니 `required = false`로 받고, 빠졌을 때 `null`이 될 수 있게 `int`가 아니라 `Integer`로 받는다.
</details>

**5.** 글 쓰기 성공에 `200`이 아니라 `201`을 주고 `Location`을 붙이는 이유는? 10장의 삭제 성공이 `204`가 아니라 `200`인 이유는?

<details>
<summary>정답</summary>

`201`은 "새로 만들었다"를 콕 집어 말한다. `Location`은 새로 만든 것의 주소라 클라이언트가 id를 본문에서 찾지 않고도 바로 상세를 부를 수 있다. 10장은 모든 응답을 `{status, message, data}` 틀로 감싸기로 해서 삭제에도 본문(`data: null`)이 있다. 본문이 있으니 `204`(본문 없음)가 아니라 `200`이다. HTTP는 둘 다 허용하고, 고른 것은 명세다.

따라 해 보기 4번: `@DeleteMapping("/api/v1/posts/{postId}")` + `@PathVariable`. 성공 `200` `data: null`. 실패 `401`(토큰 없음·틀림), `403`(남의 글), `404`(없는 글·이미 지운 글·남의 비공개 글). 두 번째 `DELETE`는 이미 지운 글이라 `404`다.
</details>

## 더 깊이

- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) — 메서드의 안전·멱등(9.2), 상태 코드(15장)의 원문
- [RFC 5789 — PATCH](https://www.rfc-editor.org/rfc/rfc5789) — PATCH가 멱등을 보장하지 않는 이유
- [RFC 9457 — Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html) — 에러 본문 표준(F1의 `ProblemDetail`)
- [OpenAPI Specification 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) — `paths`·`parameters`·`requestBody`·`responses`·`components`
- [Google AIP-185 — API 버전](https://google.aip.dev/185) · [AIP-158 — 페이지네이션](https://google.aip.dev/158) — 한 회사의 설계 지침(표준은 아니다)
- [IETF 초안 — Idempotency-Key 헤더](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header) — POST 재시도를 안전하게 하는 방법(아직 초안)
- [D03 REST API 개발 과정](../docs/knowledge/D03-rest-api-dev-process.md) · [S23 OpenAPI·Swagger](../docs/knowledge/S23-openapi-swagger.md) · [W15 offset vs cursor 페이징](../docs/knowledge/W15-paging-offset-vs-cursor.md)

## 다음

- 실습: [10-1. 새 프로젝트 시작 — 명세서 읽기](../scenario/ch10-project/10-1-new-project.md) — 명세서 한 장을 끝까지 읽고 프로젝트를 만든다.
- 실습: [10-2. 공통 응답 틀과 전역 예외 처리](../scenario/ch10-project/10-2-common-response.md) — 실패 코드마다 같은 모양의 본문을 돌려준다.
