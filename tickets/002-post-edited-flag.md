# T-002. 글 상세에 '수정됨' 표시

> 난이도 쉬움 · 유형 기존 API 변경 · DB community · 예상 25분

## 티켓

> **요청자** 기획 · **배경** 댓글로 "글 내용이 바뀌었는데 몰랐다"는 문의가 왔다. 다른 커뮤니티처럼 수정된 글에는 작성 시각 옆에 "(수정됨)"과 마지막 수정 시각을 보여 주고 싶다.

- 글 상세 응답에 마지막 수정 시각과 "수정된 적 있음" 여부를 넣어 주세요. 글 수정 API의 응답도 상세와 같은 모양이라 같이 바뀌어야 합니다.
- 조회수·좋아요가 늘어난 건 "수정"이 아닙니다.
- **완료 조건**: 기존 필드는 그대로 두고 두 필드만 추가된다.

**DB 시작 상태**: `community` 처음 상태(`bash scripts/java-db.sh --reset`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 글 2는 한 번도 고친 적 없는 글, 글 6(이스프링의 팔로워 공개 글)은 작성 뒤에 고친 글이다.

## 지금 코드

- 글 상세 조회와 글 수정은 같은 응답 DTO를 쓰지만, DTO를 만드는 곳이 두 군데다(조회 쪽 서비스와 수정 쪽 컨트롤러). 둘 다 찾는다.
- 테이블에는 이미 마지막 수정 시각 컬럼이 있고, 엔티티도 그 값을 갖고 있다. 어느 동작이 그 값을 바꾸고 어느 동작은 안 바꾸는지 엔티티 메서드를 읽어 본다.

## 화면 시나리오

```screen
{
  "title": "글 상세 — 수정됨 표시",
  "summary": "상세 응답의 edited로 '(수정됨)'을 붙이고, updatedAt을 툴팁으로 보여 준다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "질문", "right": "박디비" },
    { "type": "text", "id": "post-title", "value": "인덱스는 언제 타나요? (수정)", "emphasis": "title" },
    { "type": "text", "id": "post-meta", "value": "박디비 · 2026-09-18 14:30 · (수정됨)", "emphasis": "caption", "tone": "muted" },
    { "type": "field", "id": "edit-title", "label": "제목", "value": "인덱스는 언제 타나요? (수정)" },
    {
      "type": "actions",
      "id": "buttons",
      "items": [{ "id": "save", "label": "수정 저장", "variant": "primary" }]
    }
  ],
  "flows": [
    {
      "name": "상세 열기",
      "steps": [
        { "kind": "user", "text": "목록에서 글을 누른다", "focus": ["post-title"] },
        { "kind": "request", "method": "GET", "path": "/api/posts/2" },
        { "kind": "server", "text": "상세 DTO를 만들 때 updatedAt과, updatedAt이 createdAt보다 늦은지(edited)를 함께 담는다" },
        {
          "kind": "response",
          "status": 200,
          "body": "{\n  \"id\": 2,\n  ...,\n  \"createdAt\": \"2026-09-15T20:00:00\",\n  \"updatedAt\": \"2026-09-15T20:00:00\",\n  \"edited\": false\n}"
        },
        { "kind": "screen", "text": "edited가 false라 '(수정됨)'을 붙이지 않는다", "focus": ["post-meta"] }
      ]
    },
    {
      "name": "제목 고치기 → 수정됨",
      "steps": [
        { "kind": "user", "text": "작성자가 제목을 고치고 [수정 저장]을 누른다", "focus": ["edit-title", "save"] },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/posts/3",
          "headers": ["Authorization: Bearer tok-park", "Content-Type: application/json"],
          "body": "{\"title\": \"인덱스는 언제 타나요? (수정)\"}"
        },
        { "kind": "server", "text": "수정 서비스가 updated_at을 지금으로 바꾼다 — 응답 DTO도 상세와 같은 모양이라 edited가 true로 온다" },
        { "kind": "db", "sql": "UPDATE post SET title = ?, updated_at = ? WHERE id = 3" },
        {
          "kind": "response",
          "status": 200,
          "body": "{\n  \"id\": 3,\n  \"title\": \"인덱스는 언제 타나요? (수정)\",\n  ...,\n  \"updatedAt\": \"2026-10-09T17:30:00\",\n  \"edited\": true\n}"
        },
        { "kind": "screen", "text": "작성 시각 옆에 '(수정됨)'이 붙는다", "focus": ["post-meta"] }
      ]
    }
  ]
}
```

## 만들 것

`GET /api/posts/{id}`(상세)와 `PATCH /api/posts/{id}`(수정) 응답에 두 필드를 더한다. 나머지 필드·상태 코드·권한 규칙은 그대로다.

| 필드 | 타입 | 값 |
|---|---|---|
| `updatedAt` | ISO-8601 문자열 | 글의 마지막 수정 시각(`post.updated_at`) |
| `edited` | 불리언 | `updatedAt`이 `createdAt`보다 늦으면 `true`, 같으면 `false` |

- 조회(조회수 +1)·좋아요·댓글 수 변화는 `updated_at`을 바꾸지 않으므로 `edited`도 바뀌지 않는다.
- DB 변화 없음(스키마 그대로). 수정 API가 원래 `updated_at`을 바꾸던 동작도 그대로다.

## 직접 확인

```bash
BASE=http://localhost:8080

# 요청 A — 한 번도 고친 적 없는 글
curl -s "$BASE/api/posts/2"

# 요청 B — 고친 적 있는 글(팔로워 공개라 작성자 토큰으로)
curl -s "$BASE/api/posts/6" -H 'Authorization: Bearer tok-lee'

# 요청 C — 글 3의 제목을 작성자가 고친다
curl -s -X PATCH "$BASE/api/posts/3" -H 'Authorization: Bearer tok-park' -H 'Content-Type: application/json' \
  -d '{"title":"인덱스는 언제 타나요? (수정)"}'

# 요청 D — 고친 글 3을 다시 본다
curl -s "$BASE/api/posts/3"
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "고친 적 없는 글 2", "method": "GET", "path": "/api/posts/2" },
    {
      "id": "B",
      "title": "고친 적 있는 글 6",
      "method": "GET",
      "path": "/api/posts/6",
      "headers": { "Authorization": "Bearer tok-lee" }
    },
    {
      "id": "C",
      "title": "글 3 제목 수정",
      "method": "PATCH",
      "path": "/api/posts/3",
      "headers": { "Authorization": "Bearer tok-park" },
      "body": { "title": "인덱스는 언제 타나요? (수정)" }
    },
    { "id": "D", "title": "고친 글 3 다시 보기", "method": "GET", "path": "/api/posts/3" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.edited", "equals": false },
          { "path": "$.updatedAt", "matches": "^2026-09-15T20:00" },
          { "path": "$.createdAt", "matches": "^2026-09-15T20:00" }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.edited", "equals": true },
          { "path": "$.updatedAt", "matches": "^2026-09-26T09:00" }
        ]
      }
    },
    {
      "id": "C3",
      "request": "C",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.title", "equals": "인덱스는 언제 타나요? (수정)" },
          { "path": "$.edited", "equals": true },
          { "path": "$.updatedAt", "matches": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}" }
        ]
      }
    },
    {
      "id": "C4",
      "request": "D",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.edited", "equals": true },
          { "path": "$.updatedAt", "notEquals": "{{D.body.createdAt}}" },
          { "path": "$.viewCount", "type": "number" },
          { "path": "$.likeCount", "type": "number" },
          { "path": "$.commentCount", "type": "number" },
          { "path": "$.author.nickname", "equals": "박디비" }
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
| C1 | 요청 A | `200`, `edited: false`, `updatedAt`과 `createdAt`이 둘 다 `2026-09-15T20:00:00` |
| C2 | 요청 B | `200`, `edited: true`, `updatedAt`이 `2026-09-26T09:00:00` |
| C3 | 요청 C | `200`, 바뀐 제목, `edited: true`, `updatedAt`이 시각 문자열 — 수정 API 응답에도 두 필드가 있다 |
| C4 | 요청 D | `edited: true`, `updatedAt`이 `createdAt`(`2026-09-18T14:30:00`)과 다르다(DB에 수정 시각이 저장됐다). 기존 필드(조회수·좋아요 수·댓글 수·작성자)는 그대로 있다 |
| D1 | `SELECT id, created_at, updated_at, updated_at > created_at AS edited FROM post WHERE id IN (2, 3, 6) ORDER BY id` | 글 2 `0`, 글 3 `1`(요청 C 이후), 글 6 `1` — 응답의 `edited`와 같다 |
| R1 | 계산 위치 | "수정됨" 판정이 한 곳(엔티티 메서드 등)에 있다. DTO를 만드는 두 곳에서 각자 비교식을 쓰지 않는다 |
| R2 | 두 DTO 생성 지점 | 상세·수정 응답을 만드는 코드가 두 군데라는 걸 찾았다. 하나만 고쳐서 수정 응답에 필드가 빠지지 않는다(C3) |
| R3 | 시각 비교 | `LocalDateTime`은 `isAfter`로 비교한다. `==`나 문자열 비교를 쓰지 않는다 |

## 필요한 지식

- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — 응답 필드를 추가할 때 어디를 고치나
- [W20 시간·타임존은 왜 매번 문제인가](../docs/knowledge/W20-time-timezone.md) — `updatedAt` 비교와 DB `DATETIME`의 초 단위
- [P16 JSON·Jackson 실무](../docs/knowledge/P16-json-jackson-practical.md) — `LocalDateTime`이 JSON에서 어떻게 보이나

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어디를 고치나</summary>

상세 응답 record에 `LocalDateTime updatedAt`, `boolean edited`를 추가하면 컴파일 에러가 나는 곳이 바로 고칠 곳이다(생성자 호출이 두 군데). 테스트 코드에서 같은 record를 만들고 있으면 거기도 맞춘다.
</details>

<details>
<summary>힌트 2 — 판정</summary>

엔티티에 `public boolean isEdited() { return updatedAt.isAfter(createdAt); }`를 두고 두 곳에서 부른다.
</details>
