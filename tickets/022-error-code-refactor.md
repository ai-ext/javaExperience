# T-022. 에러 응답에 `code` — 예외 처리 한 곳으로 정리

> 난이도 중급 · 유형 리팩터 · DB community · 예상 90분

## 티켓

> **요청자** 프론트 팀·앱 팀 · **배경** 앱이 에러 문구(`detail`) 문자열을 비교해서 화면을 나누고 있다가, 문구를 고친 날 장애가 났다. 기계가 읽을 고정 `code`를 달라는 요청이다. 열어 보니 전역 핸들러에 예외마다 거의 같은 메서드가 20개 가까이 있고, 몇몇 에러(크기 범위 밖 파라미터, 경로 숫자 자리에 글자, 처리 못 한 500)는 아예 다른 모양(Spring 기본 오류 JSON)으로 나간다.

- 모든 에러 응답을 같은 Problem Details 모양으로 맞추고 `code`를 넣어 주세요. 코드 표는 아래 "만들 것"에 있습니다.
- 핸들러 20개에 `code` 한 줄씩 더하는 대신 **예외와 코드를 한 곳에서 관리**하도록 정리해 주세요(다음에 예외가 늘 때 빠뜨리지 않게). 정상 응답과 기존 에러의 상태 코드·`detail` 문구는 바꾸지 않습니다.
- 처리하지 못한 예외(500)는 내부 메시지·예외 이름을 응답에 내보내지 않고 로그에만 남깁니다.
- **완료 조건**: 아래 표의 에러가 모두 `status`·`detail`·`code`를 가진 같은 모양이고, 기존 상태 코드는 그대로다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 처음 덤프로 다시 만든다. 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 이스프링(`tok-lee`)은 북마크 폴더 `스프링 공부`를 이미 갖고 있고, `tok-choi`는 정지 회원, 글 1은 운영자의 글이다.

## 지금 코드

- 전역 예외 처리 클래스를 열어 메서드들이 서로 무엇이 다른지(상태 코드와 예외 종류뿐인지) 본다.
- 크기 범위 밖 파라미터(`size=0`)가 왜 다른 모양으로 나가는지 — 그 예외는 지금 누가 처리하고 있는지 찾는다. Spring MVC가 표준 예외를 Problem Details로 바꿔 주는 기반 클래스가 있다.

## 화면 시나리오

```screen
{
  "title": "앱 — 에러 처리",
  "summary": "앱은 detail 문구 대신 code로 분기한다. 문구를 고쳐도 앱이 깨지지 않는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "북마크 폴더", "right": "이스프링" },
    { "type": "field", "id": "folder", "label": "새 폴더 이름", "value": "스프링 공부", "error": "이미 있는 이름이에요" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "create", "label": "만들기", "variant": "primary" }] },
    { "type": "code", "id": "app", "label": "앱 코드", "value": "if (e.code === 'DUPLICATE_BOOKMARK_FOLDER_NAME') showFieldError(…)\nelse if (e.code === 'AUTHENTICATION_REQUIRED') goLogin()\nelse toast(e.detail)" }
  ],
  "flows": [
    {
      "name": "같은 이름 폴더",
      "steps": [
        { "kind": "user", "text": "이미 있는 이름으로 [만들기]를 누른다", "focus": ["create"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/me/bookmark-folders",
          "headers": ["Authorization: Bearer tok-lee", "Content-Type: application/json"],
          "body": "{\"name\": \"스프링 공부\"}"
        },
        { "kind": "server", "text": "서비스가 던진 예외가 자기 에러 코드를 들고 있고, 전역 핸들러 한 메서드가 상태·detail·code를 채운다" },
        { "kind": "response", "status": 409, "body": "{\"status\": 409, \"title\": \"Conflict\", \"detail\": \"같은 이름의 폴더가 이미 있습니다.\", \"instance\": \"/api/me/bookmark-folders\", \"code\": \"DUPLICATE_BOOKMARK_FOLDER_NAME\"}" },
        { "kind": "screen", "text": "앱이 code를 보고 입력칸 아래에 오류를 띄운다", "focus": ["folder", "app"] }
      ]
    },
    {
      "name": "범위 밖 파라미터 — 지금은 다른 모양",
      "steps": [
        { "kind": "user", "text": "목록을 size=0으로 부른다(프론트 버그)", "focus": ["app"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/posts?size=0" },
        { "kind": "server", "text": "지금: 전역 핸들러가 모르는 예외라 Spring 기본 오류 JSON(timestamp·error·path). 고친 뒤: 같은 Problem Details + INVALID_INPUT" },
        { "kind": "response", "status": 400, "body": "{\"status\": 400, \"detail\": \"입력값이 올바르지 않습니다.\", \"code\": \"INVALID_INPUT\", …}" },
        { "kind": "screen", "text": "앱의 공통 처리 한 곳에서 잡힌다", "focus": ["app"] }
      ]
    }
  ]
}
```

## 만들 것

모든 에러 응답 = Problem Details(`status`·`title`·`detail`·`instance`) + **`code`**. 상태 코드와 기존 `detail` 문구는 그대로.

| 상황(예) | 상태 | `code` |
|---|---|---|
| 요청 값 검증 실패(본문 검증, 수정 API 필드 검증, 파라미터 범위 `size=0`, 경로 자리 타입 `/api/posts/abc`) | 400 | `INVALID_INPUT` (본문·필드 검증은 지금처럼 `errors`도) |
| 본문을 읽을 수 없음(깨진 JSON) | 400 | `MALFORMED_BODY` |
| 내 글 좋아요 · 깨진 커서 · 답글 규칙 · 검색 조건 · 폴더 규칙 | 400 | `SELF_LIKE_NOT_ALLOWED` · `INVALID_CURSOR` · `INVALID_PARENT_COMMENT` · `INVALID_SEARCH_CONDITION` · `INVALID_BOOKMARK_FOLDER` |
| 토큰 없음·잘못됨(`WWW-Authenticate` 헤더 유지) | 401 | `AUTHENTICATION_REQUIRED` |
| 정지·탈퇴 회원 · 남의 글 · 남의 댓글 · 게시판 쓰기 권한 · 운영자 전용 | 403 | `MEMBER_NOT_ACTIVE` · `POST_FORBIDDEN` · `COMMENT_FORBIDDEN` · `BOARD_WRITE_FORBIDDEN` · `ADMIN_ONLY` |
| 없는 글·게시판·댓글·북마크·폴더·알림 | 404 | `POST_NOT_FOUND` · `BOARD_NOT_FOUND` · `COMMENT_NOT_FOUND` · `BOOKMARK_NOT_FOUND` · `BOOKMARK_FOLDER_NOT_FOUND` · `NOTIFICATION_NOT_FOUND` |
| 같은 이름 폴더 | 409 | `DUPLICATE_BOOKMARK_FOLDER_NAME` |
| 처리하지 못한 예외 | 500 | `INTERNAL_ERROR` — `detail`은 `서버 오류가 발생했습니다.`, 예외 이름·메시지는 로그에만 |

## 직접 확인

```bash
BASE=http://localhost:8080
J='Content-Type: application/json'; K='Authorization: Bearer tok-kimjava'

curl -s "$BASE/api/posts/999999"                                                            # 요청 A
curl -s "$BASE/api/boards/nope/posts"                                                       # 요청 B
curl -s -X POST "$BASE/api/posts" -H "$K" -H "$J" -d '{}'                                   # 요청 C — 본문 검증
curl -s "$BASE/api/boards/free/posts?size=0"                                                # 요청 D — 파라미터 범위
curl -s "$BASE/api/posts/abc"                                                               # 요청 M — 경로 타입
curl -i -X POST "$BASE/api/posts" -H "$J" -d '{}'                                           # 요청 E — 토큰 없음
curl -s "$BASE/api/me/likes" -H 'Authorization: Bearer tok-choi'                            # 요청 L — 정지 회원
curl -s -X DELETE "$BASE/api/posts/2" -H "$K"                                               # 요청 F — 남의 글
curl -s -X POST "$BASE/api/me/bookmark-folders" -H 'Authorization: Bearer tok-lee' -H "$J" -d '{"name":"스프링 공부"}'   # 요청 G
curl -s -X PUT "$BASE/api/posts/1/like" -H 'Authorization: Bearer tok-admin'               # 요청 I — 내 글 좋아요
curl -s "$BASE/api/me/likes?cursor=@@@" -H "$K"                                             # 요청 N — 깨진 커서
curl -s -X POST "$BASE/api/posts" -H "$K" -H "$J" -d '{bad'                                 # 요청 J — 깨진 JSON
curl -s -X POST "$BASE/api/posts" -H "$K" -H "$J" -d '{"boardSlug":"dev","title":"[T-022]","content":"x","tags":[null]}'   # 요청 H — 아직 남은 500
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 실패하는 요청만 보내므로(데이터가 바뀌지 않는다) 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "없는 글", "method": "GET", "path": "/api/posts/999999" },
    { "id": "B", "title": "없는 게시판", "method": "GET", "path": "/api/boards/nope/posts" },
    { "id": "C", "title": "본문 검증 실패", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": {} },
    { "id": "D", "title": "size=0", "method": "GET", "path": "/api/boards/free/posts?size=0" },
    { "id": "M", "title": "경로에 글자", "method": "GET", "path": "/api/posts/abc" },
    { "id": "E", "title": "토큰 없이 작성", "method": "POST", "path": "/api/posts", "body": {} },
    { "id": "L", "title": "정지 회원", "method": "GET", "path": "/api/me/likes", "headers": { "Authorization": "Bearer tok-choi" } },
    { "id": "F", "title": "남의 글 삭제", "method": "DELETE", "path": "/api/posts/2", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "G", "title": "같은 이름 폴더", "method": "POST", "path": "/api/me/bookmark-folders", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "name": "스프링 공부" } },
    { "id": "I", "title": "내 글 좋아요", "method": "PUT", "path": "/api/posts/1/like", "headers": { "Authorization": "Bearer tok-admin" } },
    { "id": "N", "title": "깨진 커서", "method": "GET", "path": "/api/me/likes?cursor=@@@", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "J", "title": "깨진 JSON", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava", "Content-Type": "application/json" }, "body": "{bad" },
    { "id": "H", "title": "처리 못 한 예외", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "dev", "title": "[T-022]", "content": "x", "tags": [null] } }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        { "request": "A", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "POST_NOT_FOUND" }, { "path": "$.detail", "equals": "글을 찾을 수 없습니다." }] } },
        { "request": "B", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "BOARD_NOT_FOUND" }] } }
      ]
    },
    {
      "id": "C2",
      "all": [
        { "request": "C", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "INVALID_INPUT" }, { "path": "$.errors", "type": "array" }] } },
        { "request": "D", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "INVALID_INPUT" }, { "path": "$.detail", "type": "string" }, { "path": "$.timestamp", "exists": false }] } },
        { "request": "M", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "INVALID_INPUT" }, { "path": "$.timestamp", "exists": false }] } }
      ]
    },
    {
      "id": "C3",
      "all": [
        { "request": "E", "expect": { "status": 401, "headers": { "WWW-Authenticate": { "contains": "Bearer" } }, "json": [{ "path": "$.code", "equals": "AUTHENTICATION_REQUIRED" }] } },
        { "request": "L", "expect": { "status": 403, "json": [{ "path": "$.code", "equals": "MEMBER_NOT_ACTIVE" }] } }
      ]
    },
    {
      "id": "C4",
      "all": [
        { "request": "F", "expect": { "status": 403, "json": [{ "path": "$.code", "equals": "POST_FORBIDDEN" }] } },
        { "request": "G", "expect": { "status": 409, "json": [{ "path": "$.code", "equals": "DUPLICATE_BOOKMARK_FOLDER_NAME" }, { "path": "$.detail", "equals": "같은 이름의 폴더가 이미 있습니다." }] } },
        { "request": "I", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "SELF_LIKE_NOT_ALLOWED" }] } },
        { "request": "N", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "INVALID_CURSOR" }] } }
      ]
    },
    { "id": "C5", "request": "J", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "MALFORMED_BODY" }] } },
    {
      "id": "C6",
      "request": "H",
      "note": "T-009를 이미 고쳤다면 이 요청은 400 INVALID_INPUT이다 — 둘 다 인정한다",
      "expect": {
        "bodyText": { "notContains": "Exception" },
        "anyOf": [
          { "status": 500, "json": [{ "path": "$.code", "equals": "INTERNAL_ERROR" }, { "path": "$.detail", "equals": "서버 오류가 발생했습니다." }] },
          { "status": 400, "json": [{ "path": "$.code", "equals": "INVALID_INPUT" }] }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A·B | 404 두 종류가 각자의 `code`, `detail` 문구는 그대로 |
| C2 | 요청 C·D·M | 검증 실패 세 종류가 모두 `INVALID_INPUT`, 파라미터 범위·경로 타입도 Spring 기본 오류 JSON(`timestamp`)이 아니라 Problem Details |
| C3 | 요청 E·L | `401 AUTHENTICATION_REQUIRED`(헤더 유지) — 인터셉터에서 던진 예외도 같은 길로 간다, `403 MEMBER_NOT_ACTIVE` |
| C4 | 요청 F·G·I·N | 403·409·400 예외들이 표의 `code`, 상태 그대로 |
| C5 | 요청 J | 깨진 JSON `400 MALFORMED_BODY` |
| C6 | 요청 H | 처리 못 한 예외는 `500 INTERNAL_ERROR` + 고정 문구, 응답에 예외 이름이 없다 |
| D1 | `SELECT COUNT(*) FROM post WHERE title = '[T-022]'` | `0` — 실패한 요청들이 아무것도 남기지 않았다 |
| D2 | `SELECT COUNT(*) FROM bookmark_folder WHERE member_id = 3 AND name = '스프링 공부'` | `1` — 409가 중복을 막았다 |
| R1 | 한 곳 | 에러 코드(상태·코드 이름)를 enum 하나에 모으고, 도메인 예외는 자기 코드를 들고 다니며, 전역 핸들러에는 그 공통 예외를 처리하는 메서드 **하나**가 남았다(예외마다 메서드 X). 새 예외를 더할 때 바꿀 곳이 enum 한 줄 + 예외 클래스뿐이다 |
| R2 | Spring 표준 예외 | `ResponseEntityExceptionHandler`를 상속(또는 같은 효과)해 Spring MVC 표준 예외(파라미터 검증·타입 변환·본문 읽기·지원 안 하는 메서드 등)도 Problem Details로 나간다. 기존 `MethodArgumentNotValidException` 핸들러와 겹쳐 기동이 실패하는 함정을 겪었거나 피했다 |
| R3 | 리팩터 안전망 | 정리 전에 C1~C5를 먼저 돌려 상태 코드·문구가 그대로인지 확인했고(코드만 추가된 상태와 비교), 500의 내부 메시지는 로그(`log.error`)에만 남긴다 |

## 필요한 지식

- [W08 예외는 어디서 잡나](../docs/knowledge/W08-where-to-handle-exceptions.md) — 전역 핸들러와 예외 계층
- [J04 예외](../docs/knowledge/J04-exceptions.md) — 공통 부모 예외로 묶기
- [J06 enum·애노테이션·리플렉션](../docs/knowledge/J06-enum-annotation-reflection.md) — 필드를 가진 enum
- [S05 MVC 요청 흐름](../docs/knowledge/S05-mvc-request-flow.md) — 인터셉터·컨트롤러에서 던진 예외가 핸들러까지 가는 길

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 모양</summary>

`enum ErrorCode { POST_NOT_FOUND(HttpStatus.NOT_FOUND), … }` + `abstract class ApiException extends RuntimeException { ErrorCode errorCode; }`. 기존 예외들은 `extends ApiException`으로 바꾸고 생성자에서 자기 코드를 넘긴다(메시지는 그대로). 수정 API 필드 오류처럼 응답에 더 넣을 것(`errors`)이 있는 예외는 그 값을 꺼낼 메서드를 하나 더 둔다.
</details>

<details>
<summary>힌트 2 — 핸들러</summary>

`class ApiExceptionHandler extends ResponseEntityExceptionHandler`. `@ExceptionHandler(ApiException.class)` 하나, `@ExceptionHandler(Exception.class)` 하나(500). 본문 검증은 부모의 `handleMethodArgumentNotValid`를 **오버라이드**한다(같은 예외에 `@ExceptionHandler`를 또 달면 기동이 실패한다). 나머지 표준 예외는 `handleExceptionInternal`을 오버라이드해 상태에 맞는 `code`를 붙인다. 부모가 이미 처리하는 예외가 `@ExceptionHandler(Exception.class)`로 새지 않는지(더 구체적인 쪽이 이긴다) 확인한다.
</details>
