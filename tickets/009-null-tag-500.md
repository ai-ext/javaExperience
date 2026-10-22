# T-009. 태그에 null이 섞이면 500

> 난이도 쉬움 · 유형 버그 · DB community · 예상 20분

## 티켓

> **요청자** 운영(에러 알림) · **배경** 글 작성 API에서 500이 간헐적으로 난다. 프론트 로그를 보니 태그 입력칸을 하나 추가했다가 비워 두면 `"tags": ["spring", null]`처럼 `null`이 섞여 간다.

- 프론트도 고치겠지만, 서버는 어떤 입력에도 500을 내면 안 됩니다. 잘못된 입력이니 다른 검증 오류처럼 400과 `errors`(어느 필드가 왜)를 돌려주세요.
- **완료 조건**: `null`이 섞인 작성 요청은 400이고 글은 저장되지 않는다. 정상 요청·태그 없는 요청은 그대로 201.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다.

## 지금 코드

- 먼저 재현한다: 아래 요청 A를 기준 코드에 보내고 서버 로그의 예외를 끝까지(맨 아래 `Caused by`) 읽는다. 어느 계층에서 터지는지가 단서다.
- 작성 요청의 태그 목록에는 원소마다 길이 검증이 걸려 있다. 그 검증이 `null`을 어떻게 다루는지 본다.
- 같은 태그를 받는 **수정 API**는 `null`을 이미 400으로 막는다 — 두 API가 다르게 검증하는 이유를 찾는다.

## 화면 시나리오

```screen
{
  "title": "글쓰기 — 빈 태그 칸",
  "summary": "비어 있는 태그 칸이 null로 가도 서버는 400과 어느 필드가 문제인지 돌려준다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "새 글 쓰기", "right": "김자바" },
    { "type": "field", "id": "title", "label": "제목", "value": "[T-009] null 태그" },
    { "type": "chips", "id": "tags", "label": "태그", "items": ["spring", "(빈 칸)"] },
    {
      "type": "actions",
      "id": "buttons",
      "items": [{ "id": "save", "label": "저장", "variant": "primary" }]
    },
    { "type": "toast", "id": "toast-500", "value": "알 수 없는 오류가 발생했어요", "tone": "error" },
    { "type": "field", "id": "tags-error", "label": "태그", "value": "spring, (빈 칸)", "error": "태그 이름은 1~30자여야 합니다." }
  ],
  "flows": [
    {
      "name": "지금(버그) — 500",
      "steps": [
        { "kind": "user", "text": "태그 칸 하나를 비워 둔 채 [저장]을 누른다", "focus": ["tags", "save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"boardSlug\": \"dev\", \"title\": \"[T-009] null 태그\", \"content\": \"x\", \"tags\": [\"spring\", null]}"
        },
        { "kind": "server", "text": "검증을 통과한 null이 서비스의 태그 중복 제거까지 가서 NullPointerException(List.copyOf는 null을 받지 않는다) — 전역 핸들러가 모르는 예외라 500" },
        { "kind": "response", "status": 500, "body": "{\"status\": 500, \"error\": \"Internal Server Error\"}" },
        { "kind": "screen", "text": "어디가 잘못됐는지 알 수 없는 오류 토스트", "focus": ["toast-500"] }
      ]
    },
    {
      "name": "고친 뒤 — 400",
      "steps": [
        { "kind": "user", "text": "같은 입력으로 [저장]을 누른다", "focus": ["save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"boardSlug\": \"dev\", \"title\": \"[T-009] null 태그\", \"content\": \"x\", \"tags\": [\"spring\", null]}"
        },
        { "kind": "server", "text": "요청 검증에서 tags[1]이 null이라 걸린다 — 서비스·DB까지 가지 않는다" },
        { "kind": "response", "status": 400, "body": "{\"status\": 400, \"detail\": \"입력값이 올바르지 않습니다.\", \"errors\": [{\"field\": \"tags[1]\", \"message\": \"태그 이름은 1~30자여야 합니다.\"}]}" },
        { "kind": "screen", "text": "태그 칸 아래에 오류 문구", "focus": ["tags-error"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `POST /api/posts` |
| 고칠 동작 | `tags`에 `null` 원소가 있으면 `400`, `errors[0].field`가 `tags`로 시작(예: `tags[1]`). 다른 검증 오류와 같은 Problem Details 모양 |
| 그대로인 것 | 정상 태그 `201`, `tags` 자체가 없거나 `null`이면 태그 없이 `201`, 수정 API(`PATCH`)의 기존 400 |
| DB | 400이면 글·태그 모두 저장되지 않는다 |

## 직접 확인

```bash
BASE=http://localhost:8080
H='Authorization: Bearer tok-kimjava'

curl -i -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' -d '{"boardSlug":"dev","title":"[T-009] null 태그","content":"x","tags":[null]}'            # 요청 A
curl -i -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' -d '{"boardSlug":"dev","title":"[T-009] null 태그","content":"x","tags":["spring",null]}'   # 요청 B
curl -s -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' -d '{"boardSlug":"dev","title":"[T-009] 정상","content":"x","tags":["spring"]}'           # 요청 C
curl -s -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' -d '{"boardSlug":"dev","title":"[T-009] 태그 없음","content":"x","tags":null}'           # 요청 D
curl -i -X PATCH "$BASE/api/posts/{C의 id}" -H "$H" -H 'Content-Type: application/json' -d '{"tags":[null]}'                                                          # 요청 E
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "태그가 null 하나",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "dev", "title": "[T-009] null 태그", "content": "x", "tags": [null] }
    },
    {
      "id": "B",
      "title": "정상 태그 + null",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "dev", "title": "[T-009] null 태그", "content": "x", "tags": ["spring", null] }
    },
    {
      "id": "C",
      "title": "정상 태그",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "dev", "title": "[T-009] 정상", "content": "x", "tags": ["spring"] }
    },
    {
      "id": "D",
      "title": "tags가 null",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "dev", "title": "[T-009] 태그 없음", "content": "x", "tags": null }
    },
    {
      "id": "E",
      "title": "수정 API에 null 태그",
      "method": "PATCH",
      "path": "/api/posts/{{C.body.id}}",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "tags": [null] }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 400,
        "json": [{ "path": "$.errors[0].field", "matches": "^tags" }],
        "bodyText": { "notContains": "Internal Server Error" }
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": { "status": 400, "json": [{ "path": "$.errors[0].field", "matches": "^tags" }] }
    },
    {
      "id": "C3",
      "all": [
        { "request": "C", "expect": { "status": 201, "json": [{ "path": "$.tags", "equals": ["spring"] }] } },
        { "request": "D", "expect": { "status": 201, "json": [{ "path": "$.tags", "equals": [] }] } }
      ]
    },
    { "id": "C4", "request": "E", "expect": { "status": 400 } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | `400`(500 아님), `errors[0].field`가 `tags`로 시작 |
| C2 | 요청 B | `400`, `errors[0].field`가 `tags`로 시작 |
| C3 | 요청 C·D | 정상 태그 `201`(`["spring"]`), `tags: null`은 `201`(`[]`) — 고치다가 망가뜨리지 않았다 |
| C4 | 요청 E | 수정 API는 그대로 `400` |
| D1 | `SELECT COUNT(*) FROM post WHERE title = '[T-009] null 태그'` | `0` — 400(그리고 버그 때의 500)이면 글이 남지 않는다 |
| D2 | `SELECT COUNT(*) FROM tag WHERE name IS NULL OR name = ''` | `0` |
| R1 | 원인 | Bean Validation의 `@Size`·`@Pattern` 등은 `null`을 "통과"로 본다(값이 있을 때만 검사) — 그래서 원소에 `@NotNull`(또는 `@NotBlank`)을 함께 걸어야 한다는 것을 설명할 수 있다 |
| R2 | 고친 곳 | 요청 경계(요청 DTO 검증)에서 막았다. 서비스에서 `null`을 조용히 빼 버리면(입력을 몰래 바꿈) 왜 안 좋은지 말할 수 있다 |
| R3 | 재현 테스트 | 가능하면 이 요청을 재현하는 테스트(컨트롤러 슬라이스 등)를 먼저 쓰고 고쳤다 |

## 필요한 지식

- [W10 검증은 어디서 하나](../docs/knowledge/W10-where-to-validate.md) — 요청 경계 검증
- [W21 null 처리 전략](../docs/knowledge/W21-null-handling.md) — JSON `null`이 자바로 들어오는 길
- [W08 예외는 어디서 잡나](../docs/knowledge/W08-where-to-handle-exceptions.md) — 모르는 예외가 500이 되는 이유
- [V06 현업 테스트 실무](../docs/knowledge/V06-testing-at-work.md) — 버그 재현 테스트 먼저(R3)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 로그</summary>

원인은 `NullPointerException`이고, 스택의 첫 우리 코드는 글 서비스의 태그 중복 제거 메서드다(`List.copyOf`는 `null` 원소를 받지 않는다). 요청 검증을 통과했기 때문에 서비스까지 간 것이다. 서비스 쪽을 `null`에 안전하게 바꿔도 이번엔 `null` 이름의 태그를 저장하려다 또 터진다 — 입구에서 막는 게 맞다.
</details>

<details>
<summary>힌트 2 — 한 줄</summary>

요청 record의 `List<@Size(min = 1, max = 30, …) String> tags`에서 원소 쪽에 `@NotNull(message = "태그 이름은 1~30자여야 합니다.")`을 더한다. 실패하면 이미 있는 전역 핸들러가 `errors: [{"field": "tags[0]", …}]`로 400을 만든다.
</details>
