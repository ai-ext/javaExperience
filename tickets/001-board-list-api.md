# T-001. 게시판 목록 API

> 난이도 쉬움 · 유형 새 API · DB community · 예상 20분

## 티켓

> **요청자** 프론트 팀 · **배경** 상단 게시판 탭과 글쓰기 화면의 "게시판" 드롭다운이 지금 프론트 코드에 하드코딩돼 있다. 게시판이 추가될 때마다 프론트를 다시 배포해야 한다.

- 게시판 목록을 내려주는 API를 만들어 주세요. 탭 순서는 DB에 있는 순서(정렬 순서 컬럼)를 따릅니다.
- 공지사항처럼 운영자만 글을 쓸 수 있는 게시판은 드롭다운에서 비활성으로 보여 줄 거라, 그걸 알 수 있는 값도 필요합니다.
- **완료 조건**: 로그인 없이 호출할 수 있고, 아래 "만들 것"의 모양과 순서로 내려온다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`로 세 DB를 `docker/mysql/backup/<시각>/`에 SQL 파일로 떠 둔다. CloudBeaver에 저장한 SQL 스크립트·바꾼 설정은 이 백업에 들어가지 않으니 따로 복사해 둔다 — 미리 만든 연결 세 개는 다시 들어간다). 기준 코드로 앱을 켜면 Flyway가 V1을 기준선으로 적고 V2~V6을 적용한다(다음 마이그레이션 번호는 V7).

## 지금 코드

- 게시판 엔티티와 저장소는 이미 있다(게시판 글 목록 API가 slug로 게시판을 찾을 때 쓴다). 컨트롤러·서비스는 없다.
- "운영자만 글쓰기"는 글 작성 API가 이미 검사하고 있다 — 그 검사가 어떤 컬럼 값을 보는지 찾아서 같은 기준을 쓴다.

## 화면 시나리오

```screen
{
  "title": "글쓰기 화면 — 게시판 고르기",
  "summary": "화면을 열 때 게시판 목록을 받아 탭과 드롭다운을 그린다. 운영자 전용 게시판은 고를 수 없게 표시한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "새 글 쓰기", "right": "김자바" },
    {
      "type": "list",
      "id": "boards",
      "label": "게시판",
      "items": [
        { "id": "b-notice", "title": "공지사항", "badge": "운영자 전용", "tone": "muted" },
        { "id": "b-dev", "title": "개발" },
        { "id": "b-qna", "title": "질문" },
        { "id": "b-free", "title": "자유" }
      ]
    },
    { "type": "select", "id": "board", "label": "게시판", "value": "개발" },
    { "type": "field", "id": "title", "label": "제목", "value": "" }
  ],
  "flows": [
    {
      "name": "화면 열기 → 게시판 목록",
      "steps": [
        { "kind": "user", "text": "글쓰기 화면을 연다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/boards" },
        { "kind": "server", "text": "게시판을 정렬 순서대로 읽어 slug·이름·운영자 전용 여부만 담는다(토큰 없어도 된다)" },
        { "kind": "db", "sql": "SELECT slug, name, write_role FROM board ORDER BY sort_order" },
        {
          "kind": "response",
          "status": 200,
          "body": "[\n  {\"slug\": \"notice\", \"name\": \"공지사항\", \"adminOnly\": true},\n  {\"slug\": \"dev\", \"name\": \"개발\", \"adminOnly\": false},\n  {\"slug\": \"qna\", \"name\": \"질문\", \"adminOnly\": false},\n  {\"slug\": \"free\", \"name\": \"자유\", \"adminOnly\": false}\n]"
        },
        { "kind": "screen", "text": "탭과 드롭다운이 응답 순서대로 그려지고, 공지사항에는 '운영자 전용'이 붙어 고를 수 없다", "focus": ["boards", "b-notice", "board"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/boards` |
| 인증 | 필요 없음(토큰이 있어도 결과는 같다) |
| 응답 상태 | `200` |
| 응답 본문 | 게시판 배열 — 정렬 순서(`sort_order`) 오름차순 |
| 항목 필드 | `slug`(문자열) · `name`(문자열) · `adminOnly`(불리언 — 운영자만 글을 쓸 수 있는 게시판이면 `true`). 이 세 필드만 |

```json
[
  { "slug": "notice", "name": "공지사항", "adminOnly": true },
  { "slug": "dev", "name": "개발", "adminOnly": false },
  { "slug": "qna", "name": "질문", "adminOnly": false },
  { "slug": "free", "name": "자유", "adminOnly": false }
]
```

- DB 변화 없음(조회만).

## 직접 확인

```bash
BASE=http://localhost:8080

# 요청 A — 토큰 없이
curl -i "$BASE/api/boards"

# 요청 B — 토큰이 있어도 같은 결과
curl -i "$BASE/api/boards" -H 'Authorization: Bearer tok-kimjava'
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "토큰 없이", "method": "GET", "path": "/api/boards" },
    {
      "id": "B",
      "title": "토큰 있음",
      "method": "GET",
      "path": "/api/boards",
      "headers": { "Authorization": "Bearer tok-kimjava" }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "headers": { "Content-Type": { "contains": "application/json" } },
        "json": [{ "path": "$", "type": "array" }, { "path": "$", "length": 4 }]
      }
    },
    {
      "id": "C2",
      "request": "A",
      "expect": { "json": [{ "path": "$[*].slug", "equals": ["notice", "dev", "qna", "free"] }] }
    },
    {
      "id": "C3",
      "request": "A",
      "expect": {
        "json": [
          { "path": "$[0]", "equals": { "slug": "notice", "name": "공지사항", "adminOnly": true } },
          { "path": "$[1]", "equals": { "slug": "dev", "name": "개발", "adminOnly": false } },
          { "path": "$[*].adminOnly", "equals": [true, false, false, false] }
        ]
      }
    },
    {
      "id": "C4",
      "request": "B",
      "expect": { "status": 200, "json": [{ "path": "$[*].slug", "equals": ["notice", "dev", "qna", "free"] }] }
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `200`, JSON 배열, 4개 |
| C2 | 요청 A | slug 순서가 `notice`, `dev`, `qna`, `free` — 정렬 순서 컬럼 기준 |
| C3 | 요청 A | 항목이 `slug`·`name`·`adminOnly` 세 필드뿐이고, `notice`만 `adminOnly: true` |
| C4 | 요청 B | 토큰이 있어도 `200`, 같은 순서 |
| D1 | `SELECT slug, name, write_role FROM board ORDER BY sort_order` | `notice 공지사항 ADMIN` · `dev 개발 USER` · `qna 질문 USER` · `free 자유 USER` — 응답과 같은 순서·같은 판정 |
| R1 | 응답 모양 | 엔티티(`Board`)를 그대로 돌려주지 않고 응답 전용 DTO를 쓴다(`id`·`createdAt`·`writeRole` 원문이 새지 않는다) |
| R2 | 정렬 | 정렬을 DB(`ORDER BY sort_order`)에 맡긴다. 전부 읽어 자바에서 정렬하거나 순서를 코드에 박지 않는다 |
| R3 | 운영자 전용 판정 | 글 작성 API의 "운영자만" 검사와 같은 기준(`write_role`)을 쓴다. 상수 문자열이 두 곳에 흩어지면 한 곳으로 모으는 방안을 말할 수 있다 |

## 필요한 지식

- [W01 API 하나 만들 때 실제 작업 순서](../docs/knowledge/W01-api-dev-order.md) — 저장소부터? 컨트롤러부터?
- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — 엔티티를 그대로 내보내면 생기는 일(R1)
- [S10 Spring Data와 쿼리 도구](../docs/knowledge/S10-spring-data-query.md) — 메서드 이름으로 정렬 쿼리 만들기(R2)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 저장소 메서드</summary>

Spring Data JPA는 메서드 이름만으로 정렬 쿼리를 만든다. `findAllByOrderBySortOrderAsc()`처럼 엔티티의 필드 이름(`sortOrder`)을 쓴다(컬럼 이름 `sort_order`가 아니다).
</details>

<details>
<summary>힌트 2 — 응답 DTO</summary>

`record BoardResponse(String slug, String name, boolean adminOnly)`. `adminOnly`는 `"ADMIN".equals(board.getWriteRole())`.
</details>
