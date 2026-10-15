# A2. HTTP 해부 — 요청·응답 글을 칸별로

> 개념 레슨 · 35분

## 이게 뭐냐

A1에서 HTTP는 "요청과 응답을 어떤 모양의 **글**로 쓸지 정한 약속"이라고 했다. 이번에는 그 글을 칸별로 뜯는다. 0-3에서 echo API에 경로·쿼리·헤더·본문을 채워 보냈다. curl 옵션 하나하나가 이 글의 어느 한 칸으로 가고, 서버(Spring)는 그 칸들을 하나씩 꺼내 쓴다.

요청 글은 네 부분이다.

```text
POST /post?q=spring HTTP/1.1          ← ① 요청 줄: 메서드 · 경로(+쿼리) · 버전
Host: httpbin.org                     ← ② 헤더(머리글): "이름: 값"이 한 줄에 하나
Content-Type: application/json
X-Client: studymate
Content-Length: 42
                                      ← ③ 빈 줄: 여기서 헤더가 끝난다
{"title":"hello","tags":["java","spring"]}   ← ④ 본문
```

응답 글도 모양이 같다. 첫 줄만 다르다.

```text
HTTP/1.1 200 OK                       ← ① 상태 줄: 버전 · 상태 코드 · 짧은 설명
Content-Type: application/json        ← ② 헤더
Content-Length: 573
                                      ← ③ 빈 줄
{ "args": ..., "json": ... }          ← ④ 본문
```

### 칸 하나씩

**메서드** — 이 요청으로 **무엇을 하려는지** 나타내는 동사다.

| 메서드 | 뜻 | 본문 | 게시판으로 치면 |
|---|---|---|---|
| `GET` | 가져오기(읽기만) | 없음 | 글 목록·글 하나 보기 |
| `POST` | 새로 만들기 | 있음 | 글 쓰기 |
| `PUT` | 통째로 바꾸기 | 있음 | 글 전체 고치기 |
| `PATCH` | 일부만 바꾸기 | 있음 | 제목만 고치기 |
| `DELETE` | 지우기 | 보통 없음 | 글 삭제 |

**URL** — 요청이 갈 곳이다. `http://localhost:8080/api/posts/7?sort=new&page=2`를 자르면:

| 조각 | 값 | 뜻 |
|---|---|---|
| 스킴 | `http` | 어떤 약속으로 말할지(`https`는 암호화한 HTTP) |
| 호스트 | `localhost` | 어느 컴퓨터(A3에서 자세히) |
| 포트 | `8080` | 그 컴퓨터의 몇 번 문(A3) |
| **경로**(path) | `/api/posts/7` | 서버 안의 **무엇**. `7`처럼 경로 속에 넣은 값은 "몇 번 글" 같은 **대상**을 가리킬 때 쓴다 |
| **쿼리**(query) | `sort=new&page=2` | `?` 뒤의 `이름=값`을 `&`로 이은 것. 정렬·페이지·검색어처럼 **조건**을 붙일 때 쓴다 |

요청 줄에는 경로와 쿼리만 들어간다. 호스트와 포트는 `Host:` 헤더로 따로 간다.

**헤더** — 본문 말고 **덧붙이는 정보**다. 자주 보는 것:

| 헤더 | 어느 쪽 | 뜻 |
|---|---|---|
| `Content-Type` | 요청·응답 | 본문이 어떤 형식인가. JSON이면 `application/json` |
| `Accept` | 요청 | 어떤 형식으로 답해 주면 좋겠나 |
| `Authorization` | 요청 | 내가 누구인지(로그인 토큰). F2에서 본다 |
| `Content-Length` | 요청·응답 | 본문이 몇 **바이트**인가. 보통 도구가 알아서 붙인다 |
| `X-로 시작하는 이름` | 요청 | 팀이 직접 정한 헤더(예: `X-Client`) |

**본문**(body) — 실제로 보내는 데이터 덩어리다. 요즘 API는 거의 JSON이다. 헤더의 `Content-Type`이 "이 덩어리를 어떻게 읽어라"를 알려 준다. **이게 빠지면 서버는 JSON인 줄 모른다**(아래 따라 해 보기 ③).

**상태 코드** — 응답 첫 줄의 숫자. 앞자리만 봐도 누구 잘못인지 안다.

| 코드 | 뜻 | 누구 탓 | 이 레포에서 보게 될 때 |
|---|---|---|---|
| `200 OK` | 성공 | — | 조회 성공 |
| `201 Created` | 새로 만들었다 | — | 글 쓰기 성공 |
| `204 No Content` | 성공, 돌려줄 본문 없음 | — | 삭제 성공 |
| `400 Bad Request` | 요청이 잘못됐다 | 클라이언트 | 필수 쿼리 빠짐, 깨진 JSON |
| `401 Unauthorized` | 누군지 모르겠다 | 클라이언트 | 토큰 없음 |
| `403 Forbidden` | 누군지는 아는데 권한이 없다 | 클라이언트 | 남의 글 지우기 |
| `404 Not Found` | 그런 것이 없다 | 클라이언트 | 없는 경로, 없는 글 번호 |
| `405 Method Not Allowed` | 그 주소에 그 메서드는 안 받는다 | 클라이언트 | POST만 받는 주소에 GET |
| `415 Unsupported Media Type` | 그 본문 형식은 못 읽는다 | 클라이언트 | `Content-Type` 빠짐 |
| `500 Internal Server Error` | 서버 코드가 터졌다 | **서버** | 처리하지 못한 예외(0-5) |

**4xx는 "요청을 고쳐라", 5xx는 "서버를 고쳐라"**다. 클라이언트는 이 숫자를 보고 다음 행동(다시 입력·다시 로그인·잠시 뒤 재시도)을 정한다.

**JSON** — 본문에 쓰는 글자 형식이다. 규칙이 엄격해서, 아래처럼 쓰면 서버가 읽지 못하고 400으로 거절한다.

| 흔한 실수 | JSON 규칙 |
|---|---|
| `{ title: "a" }` (키 따옴표 없음) | 키도 반드시 큰따옴표: `{ "title": "a" }` |
| `'작은따옴표'` | 큰따옴표만 |
| 날짜·함수 같은 값을 그대로 | 값은 문자열·숫자·`true`/`false`·`null`·배열·객체뿐. 날짜는 보통 `"2026-10-10T09:00:00"` 같은 문자열 |
| 끝 쉼표 `[1, 2,]`, 주석 | 안 된다 |

서버에서는 Spring 안의 **Jackson**이라는 라이브러리가 이 글자를 Java 객체로 바꾸고, 돌려줄 객체를 다시 이 글자로 바꾼다.

## 예시

### curl 옵션 ↔ HTTP 글 ↔ Spring 대응표

| 칸 | HTTP 글에서 | curl에서 | Spring에서 받는 법(0-3에서 만든 echo API) |
|---|---|---|---|
| 메서드 | 요청 줄 첫 낱말 | `-X POST`(`-d`가 있으면 자동 POST) | `@PostMapping` |
| 경로 `/posts/7` | 요청 줄 두 번째 칸 | 주소 그대로 | `@PathVariable` |
| 쿼리 `?q=spring` | 요청 줄 두 번째 칸의 `?` 뒤 | 주소 그대로, 또는 `-G --data-urlencode` | `@RequestParam` |
| 헤더 | 헤더 줄 | `-H 'X-Client: studymate'` | `@RequestHeader` |
| 본문 | 빈 줄 다음 | `-d '{...}'` | `@RequestBody` |
| 응답 상태 | 응답 상태 줄 | `-i`로 보인다 | 메서드가 정상 반환하면 200, 예외면 4xx·5xx |
| 응답 헤더 | 응답 헤더 줄 | `-i`로 보인다 | `ResponseEntity`로 붙인다(1-2) |
| 응답 본문 | 빈 줄 다음 | 마지막에 찍힌다 | 메서드의 반환값을 Jackson이 JSON으로 |

### 실제 글 (실측)

메서드·쿼리·헤더·본문을 모두 채운 요청을 httpbin에 보낸 결과다. httpbin은 받은 요청을 JSON으로 되돌려준다.

```bash
curl -v "http://httpbin.org/post?q=spring" \
  -H 'Content-Type: application/json' \
  -H 'X-Client: studymate' \
  -d '{"title":"hello","tags":["java","spring"]}'
```

```text
> POST /post?q=spring HTTP/1.1
> Host: httpbin.org
> User-Agent: curl/8.7.1
> Accept: */*
> Content-Type: application/json
> X-Client: studymate
> Content-Length: 42
>
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 573
< Server: gunicorn/19.9.0
...
{
  "args": { "q": "spring" },
  "data": "{\"title\":\"hello\",\"tags\":[\"java\",\"spring\"]}",
  "headers": { "Content-Type": "application/json", "X-Client": "studymate", ... },
  "json": { "tags": ["java", "spring"], "title": "hello" },
  "url": "http://httpbin.org/post?q=spring"
}
```

- 쿼리 `q=spring` → `args`. 헤더 → `headers`. 본문 글자 그대로 → `data`, 그 글자를 JSON으로 읽은 결과 → `json`.
- `Content-Length: 42` — 본문 `{"title":"hello",...}`가 정확히 42바이트다. 한글은 한 글자가 3바이트라 글자 수와 바이트 수가 다르다.

### 에러 응답도 같은 모양이다

Spring Boot 서버에 잘못된 요청을 보내면 상태 코드와 함께 이런 JSON이 온다(실측, 0장 정답 코드, Boot 4.1.1, 헤더 일부 생략).

```text
HTTP/1.1 405
Allow: POST
Content-Type: application/json

{"timestamp":"2026-10-09T15:00:13.969Z","status":405,"error":"Method Not Allowed","path":"/api/start/echo/7"}
```

POST만 받는 주소에 GET을 보냈더니 405와 함께 `Allow: POST` 헤더로 "POST로 보내라"를 알려 준다. 헤더도 응답의 일부라 꼭 같이 본다.

## 따라 해 보기

10~15분. 터미널에서 하나씩 보내고, 결과의 어느 칸에 무엇이 있는지 짚는다.

**① 쿼리와 헤더 보내기**

```bash
curl -i "http://httpbin.org/get?sort=new&page=2" -H 'X-Client: studymate'
```

기대: `200 OK`. 본문의 `args`에 `"page": "2"`, `"sort": "new"`가, `headers`에 `"X-Client": "studymate"`가 있다. 쿼리 값 `2`가 숫자가 아니라 **문자열** `"2"`로 온다는 점도 본다. 쿼리는 늘 글자다. 숫자로 바꾸는 것은 서버 몫이다.

**② JSON 본문 보내기** — 위 [실제 글](#실제-글-실측)의 명령을 그대로 보낸다. `json` 칸이 채워졌는지 본다.

**③ Content-Type을 빼고 보내기**

```bash
curl -s "http://httpbin.org/post" -d '{"title":"hello"}'
```

기대(실측, 일부 줄 생략):

```text
{
  "data": "",
  "form": {
    "{\"title\":\"hello\"}": ""
  },
  "headers": {
    "Content-Type": "application/x-www-form-urlencoded",
    ...
  },
  "json": null,
  ...
}
```

`json`이 `null`이다. curl은 `-d`만 쓰면 `Content-Type: application/x-www-form-urlencoded`(HTML 폼 형식)를 붙인다. 서버는 본문을 폼으로 읽으려다 엉뚱하게 잘랐다. Spring 서버라면 이 요청을 **415**로 거절한다(0-3 [망가뜨리기 ②](../scenario/ch0-first-steps/0-3-request-four-places.md#②-content-type을-빼고-보낸다--415)). JSON을 보낼 때는 **`Content-Type: application/json`을 직접 붙인다.**

**④ 상태 코드만 보기**

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://httpbin.org/status/201
curl -i http://httpbin.org/status/404
curl -i -X DELETE http://httpbin.org/get
```

기대: `201` / `HTTP/1.1 404 NOT FOUND`(본문 없음) / `HTTP/1.1 405 METHOD NOT ALLOWED`. 세 번째는 GET만 받는 주소에 DELETE를 보냈다.

## 확인 문제

**1.** `curl "http://localhost:8080/api/posts?page=2" -H 'Authorization: Bearer abc'`에서 `page=2`와 `Bearer abc`는 HTTP 글의 각각 어느 칸에 들어가나?

<details>
<summary>정답</summary>

`page=2`는 **요청 줄**의 경로 뒤 `?` 다음(쿼리)에, `Bearer abc`는 **헤더** 줄 `Authorization: Bearer abc`에 들어간다. `-X`도 `-d`도 없으니 메서드는 GET이고, 요청 줄은 `GET /api/posts?page=2 HTTP/1.1`이다.
</details>

**2.** "7번 글 보기"와 "글 목록을 최신순으로 보기"를 주소로 만든다면 `7`과 `최신순`을 각각 경로와 쿼리 중 어디에 두는 것이 자연스러운가?

<details>
<summary>정답</summary>

`7`은 **경로**(`/api/posts/7`), 최신순은 **쿼리**(`/api/posts?sort=new`)다. 경로는 "무엇(대상)"을 가리키고, 쿼리는 "어떻게(조건·필터·정렬·페이지)"를 덧붙인다. 쿼리는 빠져도 같은 대상(목록)을 가리키지만, 경로의 `7`이 빠지면 다른 것이 된다.
</details>

**3.** 서버에서 404와 500이 났다. 각각 누가 무엇을 고쳐야 하나?

<details>
<summary>정답</summary>

404는 4xx라 **요청 쪽** 문제다. 주소 오타이거나 없는 번호를 요청했다. 500은 5xx라 **서버 코드** 문제다. 처리하지 못한 예외가 났으니 서버 로그의 스택트레이스를 본다(0-5). 단, 서버가 "없는 글"을 404 대신 500으로 답하고 있다면 그것도 서버가 고칠 일이다.
</details>

**4.** `curl -X POST "http://localhost:8080/api/start/echo/7" -d '{"title":"hello"}'`로 올바른 JSON을 보냈는데 Spring 서버가 415를 돌려준다. 무엇을 빠뜨렸을 가능성이 가장 큰가?

<details>
<summary>정답</summary>

`Content-Type: application/json` 헤더다. 415는 "그 본문 형식은 못 읽는다"는 뜻이다. 헤더가 없으면 서버는 본문이 JSON인 줄 모른다. curl은 `-d`만 쓰면 `application/x-www-form-urlencoded`를 붙인다. `-H 'Content-Type: application/json'`을 더한다.
</details>

**5.** 다음 중 JSON으로 **틀린** 것을 모두 고르고 이유를 말하라. ㉠ `{"age": 20}` ㉡ `{'age': 20}` ㉢ `{"tags": ["a", "b",]}` ㉣ `{"deleted": null}`

<details>
<summary>정답</summary>

㉡과 ㉢이 틀렸다. ㉡은 작은따옴표를 썼다. JSON은 큰따옴표만 쓴다. ㉢은 배열 끝에 쉼표가 있다. JSON은 끝 쉼표를 허용하지 않는다. ㉣의 `null`은 JSON 값이다.
</details>

## 더 깊이

- [D02 서버·네트워크 기초](../docs/knowledge/D02-server-network-basics.md#2-용어-사전) — URL·헤더·상태 코드 용어
- [D03 REST API 개발 과정](../docs/knowledge/D03-rest-api-dev-process.md) — 메서드·경로를 어떻게 정하나
- [P16 JSON과 Jackson 실전](../docs/knowledge/P16-json-jackson-practical.md) — 서버가 JSON을 객체로 바꾸는 방법
- [S05 Spring MVC 요청 처리 흐름](../docs/knowledge/S05-mvc-request-flow.md#1-왜-알아야-하나) — 요청 글이 컨트롤러 메서드에 닿기까지

## 다음

[A3. 서버 프로그램](A3-server-process-port.md) — URL의 호스트·포트가 실제로 무엇인지, 서버가 "켜져 있다"는 게 무슨 뜻인지 직접 띄워 본다. 요청의 네 자리를 Spring에서 받는 실습은 [0-3](../scenario/ch0-first-steps/0-3-request-four-places.md)에서 했다.
