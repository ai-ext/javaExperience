# 9-3. 컬럼 추가와 백필

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "목록에 제목만 있으니 심심해요. 본문 앞부분을 한두 줄 미리 보여 주세요."

목록 쿼리에서 매번 `content`(TEXT, 긴 글은 8천 자)를 읽어 자르면 무겁다(2-2에서 본문을 목록에서 뺀 이유). 그래서 **미리 잘라 둔 요약 컬럼**을 만든다. 이미 있는 글 145개에도 값을 채워야 한다(**백필**). 그리고 앞으로 만들거나 고치는 글도 요약이 맞게 유지돼야 한다.

## 만들 것

| 할 일 | 내용 |
|---|---|
| V3 | `db/migration/V3__add_post_excerpt.sql` — 세 단계를 한 파일에: ① `excerpt VARCHAR(120) NULL` 추가 ② 기존 글 백필 `UPDATE post SET excerpt = LEFT(content, 100)` ③ `NOT NULL`로 바꾸기 |
| 규칙 | `excerpt` = 본문 앞 100자(`LEFT(content, 100)`과 같다) |
| 엔티티 | `excerpt` 필드 추가(`ddl-auto: validate`가 통과해야 한다) |
| 작성·수정 | 글을 만들거나(1장) 본문을 고치면(3-1) `excerpt`도 같이 바뀐다 |
| 목록 | 2-2·2-3 목록 항목과 8-4 검색 결과에 `excerpt` 필드 추가 |

## 직접 확인

```bash
BASE=http://localhost:8080
P='Authorization: Bearer tok-p02'; J='Content-Type: application/json'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }
BODY=$(python3 -c 'print("가" * 150)')

curl -s "$BASE/api/boards/dev/posts?size=3" | python3 -c 'import sys,json; print([(i["id"], len(i["excerpt"])) for i in json.load(sys.stdin)["items"]])'   # A1
X=$(curl -s -X POST "$BASE/api/posts" -H "$P" -H "$J" -d "{\"boardSlug\":\"dev\",\"title\":\"[채점] 요약 확인\",\"content\":\"$BODY\",\"tags\":[]}" | jid); echo "X=$X"   # A2
curl -s -X PATCH "$BASE/api/posts/$X" -H "$P" -H "$J" -d '{"content":"짧게 바꾼 본문"}' > /dev/null                                                              # A3
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{X}`는 A2에서 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | `SELECT is_nullable, character_maximum_length FROM information_schema.columns WHERE table_schema = 'practice' AND table_name = 'post' AND column_name = 'excerpt'` | `NO`, `120` |
| D2 | `SELECT COUNT(*) FROM post WHERE excerpt <> LEFT(content, 100)` | `0` — 기존 글과 새 글 모두 규칙대로 |
| D3 | `SELECT CHAR_LENGTH(excerpt) FROM post WHERE id = 124` | `100` — 8천 자짜리 긴 글도 잘렸다 |
| D4 | `SELECT excerpt FROM post WHERE id = {X}` | `짧게 바꾼 본문` — 본문을 고치면 요약도 바뀐다 |
| C1 | A1 | `200`, 각 항목에 `excerpt`가 있고 길이 100 이하 |
| C2 | A2 | `201` |
| R1 | 세 단계 | "NULL 허용으로 추가 → 채우기 → NOT NULL" 순서인 이유(처음부터 NOT NULL이면 기존 행 때문에 실패하거나 기본값이 들어간다)를 설명할 수 있다 |
| R2 | 한 곳에서 계산 | 요약 계산이 엔티티(예: `changeContent`)나 한 메서드에 있다. 작성·수정 경로마다 따로 자르지 않는다 |
| R3 | 큰 테이블 | 수백만 행이면 `UPDATE` 한 번이 오래 잠근다는 것과, 나눠서(배치) 채우는 방법을 안다 |

## 필요한 지식

- [S11 캐시·Redis·DB 마이그레이션](../../docs/knowledge/S11-cache-redis-migration.md)
- [R03 스키마와 테이블 설계 — 타입과 VARCHAR](../../docs/knowledge/R03-schema-types-constraints.md)
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — 응답에 필드를 추가할 때

## 다음 단계

[9-4. 새 테이블과 API — 알림](9-4-notifications.md)
