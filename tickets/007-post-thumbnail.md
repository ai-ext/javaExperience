# T-007. 글 대표 이미지 주소 컬럼 추가

> 난이도 쉬움 · 유형 스키마 변경 · DB community · 예상 40분

## 티켓

> **요청자** 프론트 팀 · **배경** 목록을 카드형으로 바꾸면서 글마다 대표 이미지(썸네일)를 보여 주려 한다. 이미지 업로드는 이미 외부 저장소로 되어 있고, 업로드하면 `https://` 주소를 받는다. 서버는 그 주소만 저장하면 된다.

- 글 작성 때 대표 이미지 주소를 선택으로 받아 저장하고, 상세와 게시판 목록 응답에 내려 주세요. 없으면 `null`.
- 주소는 `https://`로 시작해야 하고 500자까지입니다.
- 스키마는 Flyway 마이그레이션으로만 바꿉니다(운영 DB에 손으로 `ALTER` 금지).
- **완료 조건**: 기존 글은 그대로(`null`) 보이고, 앱을 다시 켜도 마이그레이션이 한 번만 적용된다.

**DB 시작 상태**: `community` 처음 상태(`bash scripts/java-db.sh --reset`). 기준 코드로 앱을 켜면 Flyway가 V1을 기준선으로 적고 V2~V6을 적용한다 — **다음 마이그레이션 번호는 V7**이다.

## 지금 코드

- 마이그레이션 파일이 어디에 있고 이름 규칙이 어떤지(`V<번호>__<설명>.sql`) 본다. 이미 적용된 파일은 고치지 않는다.
- JPA 설정이 "엔티티와 테이블이 다르면 기동 실패"(`ddl-auto: validate`)다. 엔티티에만 필드를 추가하고 마이그레이션을 빠뜨리면 앱이 안 뜬다 — 일부러 한 번 겪어 봐도 좋다.
- 글 응답 DTO가 세 종류다(작성 응답·상세·목록 항목). 이번에 어느 것에 넣는지 "만들 것"을 본다.

## 화면 시나리오

```screen
{
  "title": "글쓰기 + 카드형 목록",
  "summary": "이미지를 올리면 받은 https 주소를 글 작성 요청에 같이 보내고, 목록 카드는 thumbnailUrl로 이미지를 그린다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "새 글 쓰기", "right": "김자바" },
    { "type": "field", "id": "title", "label": "제목", "value": "[T-007] 썸네일 있는 글" },
    { "type": "field", "id": "thumb", "label": "대표 이미지", "value": "https://img.example.com/t-007.png" },
    {
      "type": "actions",
      "id": "buttons",
      "items": [{ "id": "save", "label": "저장", "variant": "primary" }]
    },
    {
      "type": "list",
      "id": "cards",
      "label": "개발 게시판",
      "items": [
        { "id": "card-new", "title": "[T-007] 썸네일 있는 글", "meta": "이미지 있음" },
        { "id": "card-old", "title": "JPA 연관관계 매핑 정리", "meta": "이미지 없음 — 기본 그림", "tone": "muted" }
      ]
    }
  ],
  "flows": [
    {
      "name": "대표 이미지와 함께 저장",
      "steps": [
        { "kind": "user", "text": "이미지를 올려 주소를 받은 뒤 [저장]을 누른다", "focus": ["thumb", "save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"boardSlug\": \"dev\", \"title\": \"[T-007] 썸네일 있는 글\", \"content\": \"대표 이미지 확인\", \"thumbnailUrl\": \"https://img.example.com/t-007.png\"}"
        },
        { "kind": "server", "text": "형식(https://, 500자)을 확인하고 글과 함께 thumbnail_url을 저장한다" },
        { "kind": "db", "sql": "INSERT INTO post (…, thumbnail_url, …) VALUES (…, 'https://img.example.com/t-007.png', …)" },
        { "kind": "response", "status": 201, "body": "{\"id\": 22, ..., \"thumbnailUrl\": \"https://img.example.com/t-007.png\"}" },
        { "kind": "screen", "text": "목록 맨 위 카드에 이미지가 보인다", "focus": ["card-new"] }
      ]
    },
    {
      "name": "기존 글",
      "steps": [
        { "kind": "user", "text": "개발 게시판 목록을 연다", "focus": ["cards"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/dev/posts?size=5" },
        { "kind": "server", "text": "마이그레이션 전에 있던 글은 thumbnail_url이 NULL — 응답에 null로 나간다" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 22, ..., \"thumbnailUrl\": \"https://…\"}, {\"id\": 2, ..., \"thumbnailUrl\": null}], ...}" },
        { "kind": "screen", "text": "이미지가 없는 카드는 기본 그림을 쓴다", "focus": ["card-old"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 마이그레이션 | `src/main/resources/db/migration/V7__add_post_thumbnail_url.sql` — `post.thumbnail_url VARCHAR(500) NULL` 추가. 기존 행 백필 없음 |
| 작성 요청 | `POST /api/posts` 본문에 선택 필드 `thumbnailUrl`. 보내면 `https://`로 시작하고 공백 없이 500자 이하, 아니면 `400` |
| 응답 | `POST /api/posts`(작성 응답)·`GET /api/posts/{id}`(상세)·`GET /api/boards/{slug}/posts`의 각 항목에 `thumbnailUrl`(문자열 또는 `null`) |
| 그대로인 것 | 나머지 필드, `thumbnailUrl`을 안 보낸 작성 요청(→ `null`) |

- 수정 API로 대표 이미지를 바꾸는 것은 이번 범위가 아니다. 상세와 같은 DTO를 쓰는 수정 응답에 `thumbnailUrl`이 함께 나오는 것은 괜찮다.

## 직접 확인

```bash
BASE=http://localhost:8080
H='Authorization: Bearer tok-kimjava'

# 요청 A — 대표 이미지와 함께 작성
curl -s -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[T-007] 썸네일 있는 글","content":"대표 이미지 확인","thumbnailUrl":"https://img.example.com/t-007.png"}'
curl -s "$BASE/api/posts/{id}"                       # 요청 B — 상세
curl -s "$BASE/api/boards/dev/posts?size=5"           # 요청 C — 목록
curl -s "$BASE/api/posts/2"                           # 요청 D — 기존 글
# 요청 E — http 주소 / 요청 F — 이미지 없이 작성
curl -i -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[T-007] http","content":"x","thumbnailUrl":"http://img.example.com/a.png"}'
curl -s -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' -d '{"boardSlug":"dev","title":"[T-007] 이미지 없음","content":"x"}'
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "대표 이미지와 함께 작성",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": {
        "boardSlug": "dev",
        "title": "[T-007] 썸네일 있는 글",
        "content": "대표 이미지 확인",
        "thumbnailUrl": "https://img.example.com/t-007.png"
      }
    },
    { "id": "B", "title": "상세", "method": "GET", "path": "/api/posts/{{A.body.id}}" },
    { "id": "C", "title": "개발 게시판 목록", "method": "GET", "path": "/api/boards/dev/posts?size=5" },
    { "id": "D", "title": "기존 글 2", "method": "GET", "path": "/api/posts/2" },
    {
      "id": "E",
      "title": "http 주소",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "dev", "title": "[T-007] http", "content": "x", "thumbnailUrl": "http://img.example.com/a.png" }
    },
    {
      "id": "F",
      "title": "이미지 없이 작성",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "dev", "title": "[T-007] 이미지 없음", "content": "x" }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": { "status": 201, "json": [{ "path": "$.thumbnailUrl", "equals": "https://img.example.com/t-007.png" }] }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": { "status": 200, "json": [{ "path": "$.thumbnailUrl", "equals": "https://img.example.com/t-007.png" }] }
    },
    {
      "id": "C3",
      "request": "C",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[0].id", "equals": "{{A.body.id}}" },
          { "path": "$.items[0].thumbnailUrl", "equals": "https://img.example.com/t-007.png" }
        ]
      }
    },
    { "id": "C4", "request": "D", "expect": { "status": 200, "json": [{ "path": "$.thumbnailUrl", "type": "null" }] } },
    { "id": "C5", "request": "E", "expect": { "status": 400 } },
    { "id": "C6", "request": "F", "expect": { "status": 201, "json": [{ "path": "$.thumbnailUrl", "type": "null" }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | `201`, 작성 응답에 보낸 `thumbnailUrl` |
| C2 | 요청 B | 상세에 같은 `thumbnailUrl` — DB에 저장됐다 |
| C3 | 요청 C | 목록 첫 항목이 방금 쓴 글이고 `thumbnailUrl`이 있다 |
| C4 | 요청 D | 기존 글은 `thumbnailUrl: null`(필드는 있다) |
| C5 | 요청 E | `http://` 주소는 `400` |
| C6 | 요청 F | 안 보내면 `201`, `thumbnailUrl: null` |
| D1 | `SELECT column_name, is_nullable, data_type, character_maximum_length FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'post' AND column_name = 'thumbnail_url'` | `thumbnail_url YES varchar 500` |
| D2 | `SELECT version, description, success FROM flyway_schema_history WHERE version = '7'` | `7 add post thumbnail url 1` — 한 행(앱을 다시 켜도 늘지 않는다) |
| D3 | `SELECT COUNT(*) FROM post WHERE thumbnail_url IS NOT NULL` | 요청 A를 보낸 횟수만큼(처음이면 `1`) — 기존 글은 모두 `NULL` |
| R1 | 마이그레이션 | 새 파일(V7)로 추가했다. 적용된 V1~V6을 고치지 않았다(체크섬 검증 실패) |
| R2 | NULL 허용 | 선택 값이라 `NULL` 허용·백필 없음이 맞다. `NOT NULL DEFAULT ''`로 "없음"을 빈 문자열로 표현하지 않는다 |
| R3 | 세 DTO | 작성·상세·목록 DTO를 모두 고쳤고, 컴파일 에러를 따라 테스트 코드까지 맞췄다 |
| R4 | 검증 위치 | 형식 검증이 요청 DTO(Bean Validation)에 있다. 주소의 이미지가 실제로 있는지는 서버가 확인하지 않는다는 한계를 말할 수 있다 |

## 필요한 지식

- [S11 캐시·Redis·DB 마이그레이션](../docs/knowledge/S11-cache-redis-migration.md) — Flyway 버전 파일과 체크섬
- [R03 스키마와 테이블 설계](../docs/knowledge/R03-schema-types-constraints.md) — `VARCHAR(500)`, NULL 허용
- [P17 파일 업로드·다운로드와 외부 스토리지](../docs/knowledge/P17-file-upload-storage.md) — 파일은 저장소에, DB에는 주소만
- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — 응답 필드 추가

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 마이그레이션</summary>

```sql
ALTER TABLE post ADD COLUMN thumbnail_url VARCHAR(500) NULL AFTER excerpt;
```
파일 이름의 밑줄은 두 개(`V7__...`)다. 앱을 켜면 로그에 `Migrating schema ... to version "7 - add post thumbnail url"`이 보인다.
</details>

<details>
<summary>힌트 2 — 엔티티와 요청</summary>

엔티티에 `@Column(name = "thumbnail_url", length = 500) private String thumbnailUrl;`. 요청 record에 `@Size(max = 500) @Pattern(regexp = "https://\\S+") String thumbnailUrl` — `@Pattern`은 `null`을 통과시키므로 선택 필드에 그대로 쓸 수 있다.
</details>
