# T-025. 글 수정이 서로 덮어쓴다 — 낙관적 락과 409

> 난이도 고급 · 유형 기존 API 변경 · DB community · 예상 90분

## 티켓

> **요청자** 모바일 앱 팀 · **배경** "PC에서 고친 내용이 사라졌어요" 문의. PC와 휴대폰에 같은 글 수정 화면을 열어 두고 PC에서 저장한 뒤, 휴대폰에서 예전 내용 그대로 저장하면 PC에서 고친 내용이 조용히 덮인다.

- 글 상세 응답에 **버전**을 내려 주세요. 수정 화면은 연 시점의 버전을 수정 요청에 함께 보냅니다.
- 보낸 버전이 지금 버전과 다르면(그사이 누가 먼저 고쳤으면) 저장하지 말고 `409`로 알려 주세요. 응답에 **지금 버전**이 있어야 앱이 "새로 불러오기"를 띄울 수 있습니다.
- 글을 **열기만 하는 것**(조회수 증가)이나 좋아요·댓글은 버전을 바꾸면 안 됩니다 — 수정 화면을 연 채로 누가 글을 읽었다고 저장이 막히면 안 된다.
- 구버전 앱은 버전을 보내지 않습니다. 버전이 없는 수정 요청은 지금처럼 받습니다.
- **완료 조건**: 같은 버전으로 두 번 저장하면 첫 번째만 반영되고 두 번째는 `409`, 그사이 동시 조회가 몇 번 있어도 결과는 같다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`로 세 DB를 `docker/mysql/backup/<시각>/`에 SQL 파일로 떠 둔다. CloudBeaver에 저장한 SQL 스크립트·바꾼 설정은 이 백업에 들어가지 않으니 따로 복사해 둔다 — 미리 만든 연결 세 개는 다시 들어간다). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다 — **다음 마이그레이션 번호는 V7**. 이스프링(`tok-lee`)의 글 18(자유글 07)을 쓴다.

## 지금 코드

고급 티켓이라 실마리는 없다. 구현한 뒤 아래 버튼 확인의 "동시에 10번 열기"(요청 V)가 왜 들어 있는지 생각해 본다.

## 화면 시나리오

```screen
{
  "title": "글 수정 — 두 기기에서 동시에",
  "summary": "PC와 휴대폰이 같은 버전에서 수정 화면을 열었다. 먼저 저장한 쪽만 반영되고, 늦은 쪽은 덮어쓰지 않고 알림을 받는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글 수정", "right": "이스프링(회원 3)" },
    { "type": "field", "id": "title", "label": "제목", "value": "[T-025] 휴대폰에서 고침" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "save", "label": "저장", "variant": "primary" }, { "id": "reload", "label": "새로 불러오기", "variant": "secondary" }] },
    { "type": "toast", "id": "conflict", "value": "다른 곳에서 먼저 수정했어요. 새로 불러온 뒤 다시 고쳐 주세요.", "tone": "warning" }
  ],
  "flows": [
    {
      "name": "PC가 먼저 저장",
      "steps": [
        { "kind": "user", "text": "PC에서 제목을 고치고 저장(화면을 열 때 버전 0)", "focus": ["save"] },
        { "kind": "request", "method": "PATCH", "path": "/api/posts/18", "headers": ["Authorization: Bearer tok-lee", "Content-Type: application/json"], "body": "{\"title\": \"[T-025] PC에서 고침\", \"version\": 0}" },
        { "kind": "db", "sql": "UPDATE post SET title = ?, …, version = 1 WHERE id = 18 AND version = 0" },
        { "kind": "response", "status": 200, "body": "{\"id\": 18, \"title\": \"[T-025] PC에서 고침\", …, \"version\": 1}" },
        { "kind": "screen", "text": "PC 저장 완료", "focus": ["title"] }
      ]
    },
    {
      "name": "휴대폰이 옛 버전으로 저장",
      "steps": [
        { "kind": "user", "text": "휴대폰(버전 0에서 연 화면)에서 저장", "focus": ["save"] },
        { "kind": "request", "method": "PATCH", "path": "/api/posts/18", "headers": ["Authorization: Bearer tok-lee", "Content-Type: application/json"], "body": "{\"title\": \"[T-025] 휴대폰에서 고침\", \"version\": 0}" },
        { "kind": "server", "text": "보낸 버전(0) ≠ 지금 버전(1) — 저장하지 않는다" },
        { "kind": "response", "status": 409, "body": "{\"status\": 409, \"detail\": \"…\", \"currentVersion\": 1}" },
        { "kind": "screen", "text": "충돌 안내 + 새로 불러오기", "focus": ["conflict", "reload"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 마이그레이션 | `V7__<설명>.sql` — `post`에 버전 컬럼(기존 글은 0부터). 운영 중 테이블이라 테이블 복사가 일어나지 않는 방식으로 |
| 상세 응답 | `GET /api/posts/{id}`, `PATCH` 응답에 `version`(숫자) |
| 수정 요청 | `PATCH /api/posts/{id}` 본문에 `version`(선택). 지금 버전과 다르면 `409` Problem Details + `currentVersion`(지금 버전). 같으면 저장하고 버전 +1 |
| 버전 없는 요청 | 지금처럼 저장(구버전 앱 호환) — 저장되면 버전은 오른다 |
| 버전을 바꾸지 않는 것 | 조회수 증가, 좋아요·댓글 수 변경 |
| 그대로인 것 | 404 → 403 순서, 부분 수정 규칙, 다른 응답 필드 |

## 직접 확인

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'; H='Authorization: Bearer tok-lee'

curl -s "$BASE/api/posts/18"                                       # 요청 A — version을 적어 둔다(아래 V0)
seq 10 | xargs -P 10 -I{} curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/posts/18" | sort | uniq -c   # 요청 V — 동시에 10번 열기
curl -s -X PATCH "$BASE/api/posts/18" -H "$H" -H "$J" -d '{"title":"[T-025] PC에서 고침","version":V0}'          # 요청 B — 200, version V0+1
curl -s -X PATCH "$BASE/api/posts/18" -H "$H" -H "$J" -d '{"title":"[T-025] 휴대폰에서 고침","version":V0}'      # 요청 X — 409, currentVersion V0+1
curl -s "$BASE/api/posts/18"                                       # 요청 G — 제목은 PC에서 고친 것
curl -s -X PATCH "$BASE/api/posts/18" -H "$H" -H "$J" -d '{"title":"자유글 07"}'                                 # 요청 O — 버전 없이(구버전 앱), 제목 되돌리기
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 마지막에 제목을 되돌리고 버전은 처음 값과의 차이로만 보므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "수정 화면 열기(버전 받기)", "method": "GET", "path": "/api/posts/18" },
    { "id": "V", "title": "그사이 동시에 10번 열기", "method": "GET", "path": "/api/posts/18", "concurrent": { "count": 10 } },
    { "id": "B", "title": "PC에서 저장(받은 버전)", "method": "PATCH", "path": "/api/posts/18", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "title": "[T-025] PC에서 고침", "version": "{{A.body.version}}" } },
    { "id": "X", "title": "휴대폰에서 저장(같은 옛 버전)", "method": "PATCH", "path": "/api/posts/18", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "title": "[T-025] 휴대폰에서 고침", "version": "{{A.body.version}}" } },
    { "id": "G", "title": "다시 열기", "method": "GET", "path": "/api/posts/18" },
    { "id": "O", "title": "구버전 앱 — 버전 없이 저장(제목 되돌리기)", "method": "PATCH", "path": "/api/posts/18", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "title": "자유글 07" } }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [{ "path": "$.version", "type": "number" }] } },
    { "id": "C2", "request": "V", "expect": { "status": 200, "json": [{ "path": "$.version", "type": "number" }, { "path": "$.version", "equals": "{{A.body.version}}" }] } },
    { "id": "C3", "request": "B", "expect": { "status": 200, "json": [{ "path": "$.title", "equals": "[T-025] PC에서 고침" }, { "path": "$.version", "type": "number" }, { "path": "$.version", "equals": "{{A.body.version + 1}}" }] } },
    { "id": "C4", "request": "X", "expect": { "status": 409, "json": [{ "path": "$.currentVersion", "type": "number" }, { "path": "$.currentVersion", "equals": "{{A.body.version + 1}}" }] } },
    { "id": "C5", "request": "G", "expect": { "status": 200, "json": [{ "path": "$.title", "equals": "[T-025] PC에서 고침" }, { "path": "$.version", "type": "number" }, { "path": "$.version", "equals": "{{A.body.version + 1}}" }] } },
    { "id": "C6", "request": "O", "expect": { "status": 200, "json": [{ "path": "$.title", "equals": "자유글 07" }, { "path": "$.version", "type": "number" }, { "path": "$.version", "equals": "{{A.body.version + 2}}" }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상세에 `version`(숫자) |
| C2 | 요청 V | 동시 10번 모두 `200`이고 버전은 A와 같다 — 조회가 버전을 올리지 않는다(조회수를 엔티티로 올리는 채로 `@Version`만 붙이면 여기서 낙관적 락 충돌 — 처리 안 하면 `500`, 409로 바꿨으면 `409` — 과 버전 변화가 나온다) |
| C3 | 요청 B | `200`, 제목 반영, `version` = A + 1 |
| C4 | 요청 X | `409`, `currentVersion` = A + 1 — 옛 버전 저장은 반영되지 않는다 |
| C5 | 요청 G | 제목은 B의 것, `version` = A + 1 |
| C6 | 요청 O | 버전 없는 수정은 지금처럼 `200`, `version` = A + 2 |
| D1 | `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'post' AND column_name = 'version'` | `version bigint NO 0` |
| D2 | `SELECT title, version FROM post WHERE id = 18` | `자유글 07`과 C6 응답의 `version` |
| D3 | `SELECT version, success FROM flyway_schema_history WHERE version = '7'` | `7 1` |
| T1 | (선택) 테스트 | 받은 버전으로 두 번 PATCH → 두 번째 `409`(`currentVersion`), 그사이 GET은 버전을 바꾸지 않는다 |
| R1 | 버전 비교 두 겹 | 요청의 `version`을 서비스에서 비교(409 + 지금 버전)하는 것과, `@Version`이 커밋 때 `UPDATE … WHERE version = ?`로 잡는 것이 각각 어떤 경쟁을 막는지(비교와 커밋 사이에 끼어든 수정 → `ObjectOptimisticLockingFailureException`도 `409`로) 말할 수 있다 |
| R2 | 버전을 올리는 것·안 올리는 것 | 조회수를 엔티티 변경 감지로 올리면 버전도 오른다 — 그래서 원자적 벌크 UPDATE로 바꿨다(벌크 JPQL은 `VERSIONED` 없이는 버전을 안 건드린다). 좋아요·댓글 수가 이미 벌크 UPDATE라서 영향이 없다는 것도 확인했다 |
| R3 | 낙관적 vs 비관적 | 글 수정에 `SELECT … FOR UPDATE`(비관적 락)가 맞지 않는 이유(사람이 화면을 몇 분 열어 둔다), `If-Match`·`ETag` 헤더로 같은 계약을 표현하는 방법과 비교할 수 있다 |

## 필요한 지식

- [S09 JPA·Hibernate](../docs/knowledge/S09-jpa-hibernate.md) — `@Version`, 변경 감지와 벌크 연산
- [P18 동시성 — 재고·카운터](../docs/knowledge/P18-concurrency-inventory.md) — 낙관적 락과 비관적 락
- [S06 REST API 설계](../docs/knowledge/S06-rest-api-clients.md) — 409 Conflict, 조건부 요청
- [S11 캐시·Redis·DB 마이그레이션](../docs/knowledge/S11-cache-redis-migration.md) — 운영 중 컬럼 추가

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 마이그레이션과 엔티티</summary>

`ALTER TABLE post ADD COLUMN version BIGINT NOT NULL DEFAULT 0, ALGORITHM = INSTANT;` — 맨 뒤에 기본값과 함께 붙이는 컬럼 추가는 테이블을 다시 쓰지 않는다(안 되는 경우면 `ALGORITHM`을 적어 두었으니 에러가 난다). 엔티티에 `@Version Long version`, 상세 응답 DTO에 `version`, 수정 요청 DTO에 `Long version`.
</details>

<details>
<summary>힌트 2 — 버전이 저절로 오른다면</summary>

`@Version`을 붙이자마자 글을 열 때마다 버전이 오르고 동시에 열면 `500`(낙관적 락 충돌)이 난다면, 상세 조회가 조회수를 엔티티 필드로 올리고(변경 감지) 있기 때문이다. 글 저장소에 `@Modifying @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")`를 두고, 응답의 조회수는 다시 읽는다. 엔티티의 조회수 증가 메서드는 지운다.
</details>
