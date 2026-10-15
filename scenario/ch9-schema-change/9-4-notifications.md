# 9-4. 새 테이블과 API — 알림

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "내 글에 좋아요나 댓글이 달리면 알림을 주세요. 안 읽은 알림 개수도 보여 주고, 누르면 읽음 처리요."

새 기능에는 새 테이블이 필요하다. 테이블을 마이그레이션으로 만들고, **기존 기능(좋아요·댓글)이 성공할 때 알림이 함께 생기게** 연결한다. 기존 기능을 건드리는 일이라, 알림 때문에 좋아요가 실패하거나 같은 알림이 두 번 생기면 안 된다.

## 만들 것

**V4** — `db/migration/V4__create_notification.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `member_id` | 알림을 받는 회원(글 작성자), FK → `member` |
| `actor_id` | 좋아요·댓글을 한 회원, FK → `member` |
| `type` | `VARCHAR(20)`, `CHECK (type IN ('LIKE', 'COMMENT'))` |
| `post_id` | FK → `post` |
| `comment_id` | 댓글 알림이면 그 댓글, 아니면 `NULL`(FK → `comment`) |
| `read_at` | 읽은 시각, 안 읽었으면 `NULL` |
| `created_at` | 만든 시각 |
| 인덱스 | `(member_id, read_at, created_at, id)` — "내 안 읽은 알림 최신순" 조회용 |

**알림이 생기는 때**

| 사건 | 알림 |
|---|---|
| 좋아요가 **새로** 생김(4-1 PUT에서 행이 추가될 때) | 글 작성자에게 `LIKE` |
| 이미 좋아요인데 또 PUT | 만들지 않는다 |
| 좋아요 취소 | 이미 만든 알림은 지우지 않는다 |
| 댓글·답글 작성(5장) | 글 작성자에게 `COMMENT`(`comment_id` 채움) |
| 자기 글에 자기가 댓글 | 만들지 않는다 |

**API** — 토큰 필요

| 메서드·경로 | 응답 |
|---|---|
| `GET /api/me/notifications?unreadOnly=false&size=20` | `200` `{ "items": [ { "id", "type", "actor": { "id", "nickname" }, "postId", "commentId", "read", "createdAt" } ], "unreadCount": 3 }` — 최신순 |
| `PATCH /api/me/notifications/{id}/read` | `204`. 남의 알림·없는 알림 `404` |

## 직접 확인

학습용 DB의 12번 글은 회원 2가 썼다. 회원 3(`tok-p03`)이 좋아요와 댓글을 단다.

```bash
BASE=http://localhost:8080
A='Authorization: Bearer tok-p02'; B='Authorization: Bearer tok-p03'; C='Authorization: Bearer tok-p05'; J='Content-Type: application/json'
cnt() { docker compose exec -T mysql mysql -ucommunity -pcommunity practice -N -e "SELECT COUNT(*) FROM notification WHERE member_id = 2" 2>/dev/null; }

curl -s -X DELETE "$BASE/api/posts/12/like" -H "$B" > /dev/null      # Y0 처음 상태로
cnt                                                                   # 전
curl -s -X PUT "$BASE/api/posts/12/like" -H "$B"; echo               # Y1 좋아요 → 알림 1
curl -s -X PUT "$BASE/api/posts/12/like" -H "$B"; echo               # Y2 또 → 알림 없음
curl -s -X POST "$BASE/api/posts/12/comments" -H "$B" -H "$J" -d '{"content":"[채점] 알림 확인 댓글"}'; echo   # Y3 댓글 → 알림 1
cnt                                                                   # 후
curl -s -H "$A" "$BASE/api/me/notifications?size=2"; echo            # Y4
NID=$(curl -s -H "$A" "$BASE/api/me/notifications?size=1" | python3 -c 'import sys,json; print(json.load(sys.stdin)["items"][0]["id"])')
curl -i -X PATCH "$BASE/api/me/notifications/$NID/read" -H "$C"      # Y5 남의 알림
curl -i -X PATCH "$BASE/api/me/notifications/$NID/read" -H "$A"      # Y6 내 알림
curl -s -H "$A" "$BASE/api/me/notifications?unreadOnly=true&size=50" | python3 -c "import sys,json; print($NID in [i['id'] for i in json.load(sys.stdin)['items']])"   # Y7
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | Y1 **전** `SELECT COUNT(*) FROM notification WHERE member_id = 2` | 값 n을 기억 |
| D2 | Y3 뒤 같은 쿼리 | n+2 — 좋아요 1, 댓글 1(Y2는 알림을 만들지 않았다) |
| D3 | `SELECT type, actor_id, post_id, comment_id IS NOT NULL FROM notification WHERE member_id = 2 ORDER BY id DESC LIMIT 2` | `COMMENT, 3, 12, 1` / `LIKE, 3, 12, 0` |
| D4 | `SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'practice' AND table_name = 'notification' AND column_name = 'read_at'` | `1` 이상 — 안 읽은 알림 조회용 인덱스에 `read_at`이 들어 있다 |
| C1 | Y4 | `200`, 첫 항목 `type`=`COMMENT`·`actor.id`=3·`postId`=12, 둘째 항목 `type`=`LIKE`, `unreadCount` ≥ 2 |
| C2 | Y5 / Y6 | `404` / `204` |
| C3 | Y7 | `False` — 읽은 알림은 안 읽은 목록에서 빠진다 |
| R1 | 연결 방식 | 알림 생성을 좋아요·댓글 서비스 안에서 바로 부르는지, 이벤트(`ApplicationEventPublisher` + `@TransactionalEventListener(AFTER_COMMIT)`)로 떼어 냈는지, 그 차이(알림 실패가 좋아요를 되돌리나?)를 설명할 수 있다 |
| R2 | 중복 없음 | "새로 생겼을 때만" 알림을 만든다 — 4-1의 멱등 판단 결과를 재사용한다 |
| R3 | 소유자 | 읽음 처리가 "내 알림인가"를 확인한다(IDOR) |
| R4 | 개수 | `unreadCount`를 목록을 다 읽어 세지 않고 `COUNT` 쿼리(인덱스 사용)로 구한다 |

## 필요한 지식

- [S08 — 이벤트와 커밋의 관계](../../docs/knowledge/S08-transactions.md#이벤트와-커밋의-관계)
- [W14 동기 vs 비동기, 블로킹 vs 논블로킹](../../docs/knowledge/W14-sync-async-blocking.md)
- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md)
- [D11 — IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기)

## 다음 단계

[9-5. 서비스를 멈추지 않는 이름 변경](9-5-expand-contract.md)
