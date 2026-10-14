# T-029. 댓글을 2만 자까지 — 운영 중 컬럼 타입 바꾸기(넓히기·양쪽 쓰기·배치 백필)

> 난이도 고급 · 유형 마이그레이션 · DB practice · 예상 120분

## 티켓

> **요청자** 기획·DBA · **배경** 질문 게시판에서 에러 로그·코드를 댓글로 붙여 넣으려다 "1000자 이하" 오류를 만난다는 문의가 많다. 기획은 **2만 자**까지 늘리길 원한다. DBA: "`comment.content`를 `MODIFY`하면 테이블 전체 복사(`ALGORITHM=COPY`)라 운영 3천만 행 기준 수십 분 쓰기가 막힌다. 서비스를 멈추지 않는 방법으로 해 달라." 배포는 서버 여러 대를 한 대씩 바꾸는 방식이라, 한동안 **옛 서버와 새 서버가 같이 돈다**.

- 댓글을 최대 20,000자까지 쓰고 읽을 수 있게 해 주세요.
- 이번 배포는 **넓히기 단계**까지입니다: 새 컬럼을 붙이고, 새 서버는 양쪽에 쓰고, 읽기는 새 컬럼에서(아직 안 옮긴 행은 옛 컬럼으로). 옛 컬럼 정리(좁히기)는 다음 배포 — 이번 티켓에서 하지 않습니다.
- 배포 중에도 옛 서버가 새 서버가 쓴 댓글을 읽을 수 있어야 합니다(옛 서버는 옛 컬럼만 읽는다 — 앞부분만 보여도 된다).
- 기존 댓글 옮기기(백필)는 **마이그레이션 안에서 한 번에 하지 말고**, 운영자가 여러 번 나눠 부를 수 있는 API로: 한 번에 몇 행 옮겼는지, 몇 행 남았는지 알려 주세요. 다시 불러도 안전해야 합니다.
- **완료 조건**: 백필 API를 남은 행이 0이 될 때까지 부르면 끝, 1,200자 댓글이 그대로 저장·조회되고, 옛 컬럼에는 그 앞 1000자가 있다.

**DB 시작 상태**: `practice` 처음 상태(`bash scripts/java-db.sh --reset`). 기준 코드를 practice 프로파일로 켜면 Flyway가 V2~V6을 적용한다 — **다음 마이그레이션 번호는 V7**. 댓글 351개. 운영자는 `tok-p01`, 댓글은 리액트에서왔어요(`tok-p07`)가 댓글 없는 글 138에 단다(마지막에 지운다).

## 지금 코드

고급 티켓이라 실마리는 없다. 시작 전에 DBA의 말을 직접 확인한다 — 실습 DB에서 `CREATE TABLE tmp_c LIKE comment;` 뒤 `ALTER TABLE tmp_c MODIFY content TEXT NOT NULL, ALGORITHM=INPLACE, LOCK=NONE;`과 `ALTER TABLE tmp_c MODIFY content VARCHAR(20000) NOT NULL;`이 각각 무엇을 말하는지 보고 `DROP TABLE tmp_c;`(실습 DB라서 하는 실험이다 — 운영 DB에서 하지 않는다).

## 화면 시나리오

```screen
{
  "title": "질문 글 — 로그를 댓글로",
  "summary": "긴 에러 로그를 댓글로 붙여 넣는다. 배포 중에도 옛 서버·새 서버 어디로 가든 댓글이 보여야 한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글 138", "right": "리액트에서왔어요(회원 7)" },
    { "type": "field", "id": "input", "label": "댓글", "value": "코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. …(1,200자)", "multiline": true },
    { "type": "actions", "id": "buttons", "items": [{ "id": "submit", "label": "등록", "variant": "primary" }] },
    { "type": "code", "id": "admin", "label": "운영자 백필", "value": "POST /api/admin/backfills/comment-body?batchSize=100 → {\"updated\": 100, \"remaining\": 251}" }
  ],
  "flows": [
    {
      "name": "긴 댓글 등록(새 서버)",
      "steps": [
        { "kind": "user", "text": "1,200자 로그를 붙여 넣고 등록", "focus": ["submit"] },
        { "kind": "request", "method": "POST", "path": "/api/posts/138/comments", "headers": ["Authorization: Bearer tok-p07", "Content-Type: application/json"], "body": "{\"content\": \"코드와 로그를 … (1,200자)\"}" },
        { "kind": "db", "sql": "INSERT INTO comment (…, content, body, …) VALUES (…, '<앞 1000자>', '<1,200자 전부>', …)", "note": "옛 서버는 content만 읽는다 — 앞 1000자라도 보인다" },
        { "kind": "response", "status": 201, "body": "{\"id\": 352, \"content\": \"코드와 로그를 … (1,200자 전부)\", …}" },
        { "kind": "screen", "text": "전부 보인다", "focus": ["input"] }
      ]
    },
    {
      "name": "기존 댓글 옮기기",
      "steps": [
        { "kind": "user", "text": "배포가 끝난 뒤 운영자가 백필을 남은 행이 0이 될 때까지 부른다", "focus": ["admin"] },
        { "kind": "request", "method": "POST", "path": "/api/admin/backfills/comment-body?batchSize=100", "headers": ["Authorization: Bearer tok-p01"] },
        { "kind": "db", "sql": "UPDATE comment SET body = content WHERE body IS NULL ORDER BY id LIMIT 100", "note": "호출 하나 = 짧은 트랜잭션 하나" },
        { "kind": "response", "status": 200, "body": "{\"updated\": 100, \"remaining\": 251}" },
        { "kind": "screen", "text": "네 번째 호출에서 remaining 0", "focus": ["admin"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 마이그레이션 | `V7__<설명>.sql` — 20,000자를 담을 새 컬럼 추가(NULL 허용). 테이블 복사가 일어나지 않는 방식으로(알고리즘을 적어 두면 안 될 때 바로 에러). **기존 행 복사는 넣지 않는다** |
| 쓰기 | 새 댓글은 새 컬럼에 전부, 옛 컬럼에는 앞 1000자(문자 기준 — MySQL `LEFT(…, 1000)`과 같게) |
| 읽기 | 새 컬럼 값, 비어 있으면(아직 안 옮긴 행) 옛 컬럼 |
| 검증 | 댓글 1~20,000자(넘으면 `400`) |
| 백필 API | `POST /api/admin/backfills/comment-body?batchSize=`(1~1000, 기본 1000) — 운영자만(아니면 `403`). 아직 안 옮긴 행을 `batchSize`개만 옮기고 `{"updated": 옮긴 수, "remaining": 남은 수}`. 다시 불러도 안전(이미 옮긴 행은 건너뛴다) |
| 다음 배포(이번엔 안 함) | 새 컬럼만 읽고 쓰기 → 옛 컬럼 NULL 허용 → 백업·검증 뒤 옛 컬럼 삭제 |

## 직접 확인

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'; ADMIN='Authorization: Bearer tok-p01'

for i in 1 2 3 4 5; do curl -s -X POST "$BASE/api/admin/backfills/comment-body?batchSize=100" -H "$ADMIN"; echo; done   # 요청 B — 100,100,100,51,0 / 남은 수 0
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/admin/backfills/comment-body" -H 'Authorization: Bearer tok-p02'   # 요청 N — 403
LONG=$(python3 -c "print(('코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. '*100)[:1200])")
curl -s -X POST "$BASE/api/posts/138/comments" -H 'Authorization: Bearer tok-p07' -H "$J" -d "{\"content\":\"$LONG\"}"   # 요청 L — 201
curl -s "$BASE/api/posts/138/comments"                                       # 요청 G — 1,200자 그대로
curl -s "$BASE/api/posts/97/comments"                                        # 요청 K — 기존 댓글 그대로
curl -s -X DELETE "$BASE/api/comments/<L의 id>" -H 'Authorization: Bearer tok-p07'   # 요청 Z
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 백필은 다 끝나면 `0, 0`을 돌려주고 긴 댓글은 마지막에 지우므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "B", "title": "백필 100개씩 다섯 번", "method": "POST", "path": "/api/admin/backfills/comment-body?batchSize=100", "headers": { "Authorization": "Bearer tok-p01" }, "repeat": 5 },
    { "id": "N", "title": "운영자가 아니면", "method": "POST", "path": "/api/admin/backfills/comment-body", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "L", "title": "1,200자 댓글", "method": "POST", "path": "/api/posts/138/comments", "headers": { "Authorization": "Bearer tok-p07" }, "body": { "content": "코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 " } },
    { "id": "G", "title": "글 138 댓글 목록", "method": "GET", "path": "/api/posts/138/comments" },
    { "id": "K", "title": "기존 댓글(글 97)", "method": "GET", "path": "/api/posts/97/comments" },
    { "id": "Z", "title": "긴 댓글 지우기", "method": "DELETE", "path": "/api/comments/{{L.body.id}}", "headers": { "Authorization": "Bearer tok-p07" } }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        { "request": "B#1", "expect": { "status": 200, "json": [{ "path": "$.updated", "type": "number" }, { "path": "$.updated", "lte": 100 }, { "path": "$.remaining", "type": "number" }] } },
        { "request": "B#5", "expect": { "status": 200, "json": [{ "path": "$.updated", "equals": 0 }, { "path": "$.remaining", "equals": 0 }] } }
      ]
    },
    { "id": "C2", "request": "N", "expect": { "status": 403 } },
    { "id": "C3", "request": "L", "expect": { "status": 201, "json": [{ "path": "$.content", "length": 1200 }, { "path": "$.content", "equals": "코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 붙여 넣은 긴 댓글입니다. 코드와 로그를 그대로 " }] } },
    { "id": "C4", "request": "G", "expect": { "status": 200, "json": [{ "path": "$", "length": 1 }, { "path": "$[0].content", "length": 1200 }] } },
    { "id": "C5", "request": "K", "expect": { "status": 200, "json": [{ "path": "$[0].content", "equals": "다음 편도 기대할게요" }, { "path": "$[4].content", "equals": "정리 깔끔하네요 👍" }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 B | 백필 API가 있고(`updated` ≤ 100, `remaining`), 다섯 번째에는 `updated: 0`, `remaining: 0` — 351행이 100·100·100·51로 끝났다 |
| C2 | 요청 N | 운영자가 아니면 `403` |
| C3 | 요청 L | 1,200자 댓글이 `201`, 응답에 1,200자 그대로 |
| C4 | 요청 G | 목록에서도 1,200자 그대로 |
| C5 | 요청 K | 기존 댓글(이모지 포함)이 그대로 보인다 — 회귀 가드(기준 코드도 통과) |
| D1 | `SELECT COUNT(*) FROM comment WHERE body IS NULL` (새 컬럼 이름은 각자) | `0` — 다 옮겼다 |
| D2 | `SELECT COUNT(*) FROM comment WHERE content <> LEFT(body, 1000)` | `0` — 옛 컬럼은 언제나 새 컬럼의 앞 1000자(옛 서버가 읽어도 맞다) |
| D3 | `SELECT CHAR_LENGTH(body), CHAR_LENGTH(content) FROM comment WHERE post_id = 138 ORDER BY id DESC LIMIT 1` | `1200 1000` |
| D4 | `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'comment' AND column_name IN ('content', 'body')` | `content varchar NO`, `body mediumtext YES`(또는 고른 타입) — 옛 컬럼은 이번에 그대로 |
| D5 | `SELECT version, success FROM flyway_schema_history WHERE version = '7'` | `7 1` |
| T1 | (선택) 테스트 | 1,500자 댓글 → 새 컬럼 1500·옛 컬럼 1000, 백필 API를 반복 호출하면 남은 행 0·D2 조건 0 |
| R1 | 왜 MODIFY가 아닌가 | `VARCHAR`는 utf8mb4에서 16,383자가 최대라 20,000자는 TEXT 계열이어야 하고, `VARCHAR → TEXT`는 타입 변경이라 INPLACE가 안 된다(직접 본 에러 메시지). `TEXT`(65,535바이트)로 4바이트 문자 20,000자가 들어가는지 계산했다 |
| R2 | 단계와 되돌리기 | 넓히기 → 양쪽 쓰기 → 백필 → 읽기 전환 → (다음 배포) 좁히기. 각 단계에서 배포를 되돌려도 데이터가 안 깨지는 이유(옛 컬럼을 계속 채우므로 이전 버전으로 롤백해도 읽힌다), 좁히기는 되돌릴 수 없어 따로 하는 이유 |
| R3 | 백필 방식 | 마이그레이션 안의 `UPDATE` 한 번 대신 API로 나눈 이유(배포 시간·잠금·재시작), 호출 하나가 짧은 트랜잭션인지, 수천만 행이면 `WHERE body IS NULL ORDER BY id LIMIT`이 매번 앞을 다시 훑는 문제와 id 범위로 걷는 방법 |

## 필요한 지식

- [S11 캐시·Redis·DB 마이그레이션](../docs/knowledge/S11-cache-redis-migration.md) — 무중단 스키마 변경(expand/contract)
- [R03 스키마·타입·제약](../docs/knowledge/R03-schema-types-constraints.md) — VARCHAR·TEXT, 문자 수와 바이트 수
- [D06 배포란 무엇인가](../docs/knowledge/D06-deployment-concepts.md) — 롤링 배포와 롤백
- [S15 비동기·스케줄링·배치](../docs/knowledge/S15-async-scheduling-batch.md) — 나눠서 처리하는 배치

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 마이그레이션과 엔티티</summary>

`ALTER TABLE comment ADD COLUMN body MEDIUMTEXT NULL, ALGORITHM = INSTANT;` 하나뿐(복사 없음). 엔티티에 `@Column(name = "body", columnDefinition = "mediumtext") String body`를 더하고, 생성자에서 `body = 전부`, `content = 앞 1000자`(글 요약을 자르는 코드처럼 코드 포인트 기준). `getContent()`는 `body != null ? body : content`. 요청 검증의 1000을 20000으로.
</details>

<details>
<summary>힌트 2 — 백필 API</summary>

네이티브 `@Modifying` 쿼리 `UPDATE comment SET body = content WHERE body IS NULL ORDER BY id LIMIT :batchSize`와 `SELECT COUNT(*) FROM comment WHERE body IS NULL`. 서비스 메서드 하나(`@Transactional`)가 둘을 부르고, 컨트롤러는 정합성 배치 API처럼 운영자인지 확인한다.
</details>
