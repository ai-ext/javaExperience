# T-023. 같은 글에 댓글이 몰리면 500 — 교착 상태

> 난이도 고급 · 유형 버그 · DB community · 예상 75분

## 티켓

> **요청자** 운영 · **배경** 라이브 방송 공지 글에 댓글이 한꺼번에 달리자 "댓글 등록 실패"가 쏟아졌다. 서버 로그에는 `Deadlock found when trying to get lock; try restarting transaction`이 수십 줄. 좋아요는 같은 시간에 몰려도 멀쩡했다.

- 같은 글에 여러 회원이 동시에 댓글을 달아도 **모두 저장**되게 고쳐 주세요(재시도해 달라고 사용자에게 떠넘기지 않는다).
- 글의 댓글 수(`commentCount`)는 실제 댓글 수와 같아야 합니다.
- 원인을 로그와 DB 잠금 정보로 설명해 주세요 — "동시에 와서"가 아니라 **어떤 잠금 두 개가 서로를 기다렸는지**.
- **완료 조건**: 서로 다른 회원 8명이 같은 글에 동시에 댓글을 달면 8개 모두 `201`, 댓글 수가 정확히 8 오른다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 처음 덤프로 다시 만든다. 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 글 14(자유 게시판, 이스프링의 공개 글)에 동시성 회원 `tok-c01`~`tok-c08`이 댓글을 단다.

## 지금 코드

고급 티켓이라 실마리는 없다. 아래 버튼 확인(또는 `직접 확인`의 `xargs -P 8` 줄)을 기준 코드에 돌려 재현하고, 실패 직후 `SHOW ENGINE INNODB STATUS`의 `LATEST DETECTED DEADLOCK` 부분을 읽는 데서 시작한다.

## 화면 시나리오

```screen
{
  "title": "라이브 공지 — 댓글이 한꺼번에",
  "summary": "많은 회원이 같은 글에 동시에 댓글을 단다. 모두 등록되고 댓글 수가 그만큼 올라야 한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유글 03", "right": "동시성01(회원 7)" },
    { "type": "stats", "id": "counts", "items": [{ "id": "comments", "label": "댓글", "value": "0" }] },
    { "type": "field", "id": "input", "label": "댓글", "value": "[T-023] 동시 댓글" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "submit", "label": "등록", "variant": "primary" }] },
    { "type": "toast", "id": "error", "value": "댓글 등록에 실패했습니다", "tone": "error" }
  ],
  "flows": [
    {
      "name": "지금(버그) — 8명이 동시에 등록",
      "steps": [
        { "kind": "user", "text": "8명이 거의 동시에 등록을 누른다", "focus": ["submit"] },
        { "kind": "request", "method": "POST", "path": "/api/posts/14/comments", "headers": ["Authorization: Bearer tok-c01", "Content-Type: application/json"], "body": "{\"content\": \"[T-023] 동시 댓글\"}" },
        { "kind": "db", "sql": "INSERT INTO comment (post_id, …) VALUES (14, …)", "note": "외래키 확인 — 글 14 행에 공유 잠금(S)" },
        { "kind": "db", "sql": "UPDATE post SET comment_count = comment_count + 1 WHERE id = 14", "note": "배타 잠금(X)이 필요한데 다른 요청도 S를 쥐고 있다 → 서로 기다림 → MySQL이 한쪽을 롤백" },
        { "kind": "response", "status": 500 },
        { "kind": "screen", "text": "8명 중 대부분이 실패 토스트를 본다", "focus": ["error"] }
      ]
    },
    {
      "name": "고친 뒤",
      "steps": [
        { "kind": "user", "text": "8명이 동시에 등록", "focus": ["submit"] },
        { "kind": "request", "method": "POST", "path": "/api/posts/14/comments", "headers": ["Authorization: Bearer tok-c01", "Content-Type: application/json"], "body": "{\"content\": \"[T-023] 동시 댓글\"}" },
        { "kind": "server", "text": "같은 글의 댓글 작성은 잠금을 같은 순서로 잡아 줄을 선다 — 서로를 기다리는 고리가 생기지 않는다" },
        { "kind": "response", "status": 201, "body": "{\"id\": 31, \"postId\": 14, …}" },
        { "kind": "screen", "text": "모두 등록, 댓글 수 +8", "focus": ["comments"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `POST /api/posts/{postId}/comments` |
| 고칠 동작 | 같은 글에 동시에 와도 교착 상태로 실패하지 않는다 — 모두 `201` |
| 함께 지킬 것 | 댓글 저장과 `comment_count` 증가는 여전히 한 트랜잭션(둘 중 하나만 반영되면 안 된다), 숫자는 원자적 증가 |
| 그대로인 것 | 응답 모양·`Location`, 볼 수 없는 글 404, 답글 규칙(400·404), 커밋 뒤 알림 |
| 하지 말 것 | 격리 수준을 바꾸거나 외래키를 지워서 피하기 |

## 직접 확인

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'

curl -s "$BASE/api/posts/14"                                    # 요청 A — 지금 commentCount
for i in 01 02 03 04 05 06 07 08; do echo tok-c$i; done \
  | xargs -P 8 -I{} curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts/14/comments" \
      -H 'Authorization: Bearer {}' -H "$J" -d '{"content":"[T-023] 동시 댓글"}' | sort | uniq -c   # 요청 P — 8개 동시
curl -s "$BASE/api/posts/14"                                    # 요청 B — A의 commentCount + 8
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 앞뒤 차이만 보므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "처음 댓글 수", "method": "GET", "path": "/api/posts/14" },
    {
      "id": "P",
      "title": "서로 다른 8명이 동시에 댓글",
      "method": "POST",
      "path": "/api/posts/14/comments",
      "headers": { "Authorization": "Bearer {{tok}}" },
      "body": { "content": "[T-023] 동시 댓글" },
      "concurrent": { "count": 8, "vars": { "tok": ["tok-c01", "tok-c02", "tok-c03", "tok-c04", "tok-c05", "tok-c06", "tok-c07", "tok-c08"] } }
    },
    { "id": "B", "title": "다시 댓글 수", "method": "GET", "path": "/api/posts/14" }
  ],
  "checks": [
    { "id": "C1", "request": "P", "expect": { "status": 201, "bodyText": { "notContains": "Internal Server Error" } } },
    { "id": "C2", "request": "P", "expect": { "distinct": { "path": "$.id", "count": 8 } } },
    { "id": "C3", "request": "B", "expect": { "status": 200, "json": [{ "path": "$.commentCount", "equals": "{{A.body.commentCount + 8}}" }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 P | 8개 모두 `201` |
| C2 | 요청 P | 8개 응답의 댓글 `id`가 모두 다르다 — 실제로 8개가 저장됐다 |
| C3 | 요청 A·B | B의 `commentCount` = A의 `commentCount + 8` |
| D1 | `SELECT p.comment_count, (SELECT COUNT(*) FROM comment c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS real_count FROM post p WHERE p.id = 14` | 두 값이 같다 |
| D2 | (재현 때) `SHOW ENGINE INNODB STATUS` — `LATEST DETECTED DEADLOCK` | 두 트랜잭션이 모두 `post` 행 14에 `lock mode S`를 쥐고 `lock_mode X`를 기다린다(SELECT가 아니지만 읽기 전용 확인이라 허용) |
| T1 | (선택) 동시성 테스트 | 스레드 8개로 같은 글에 댓글 작성 → 예외 0, `comment_count` = 실제 행 수. 고치기 전 코드에서는 실패해야 한다 |
| R1 | 원인 | INSERT의 **외래키 확인**이 부모 행(글 14)에 공유 잠금(S)을 걸고, 같은 트랜잭션의 `UPDATE post`가 배타 잠금(X)으로 올리려다 서로의 S에 막힌다(S→X 승격 교착). SELECT를 하지 않았는데 잠금이 생기는 이유를 말할 수 있다 |
| R2 | 고친 방법 | 잠금 순서를 바꿨다 — 글 행의 X를 먼저 잡고(UPDATE 먼저, 또는 `SELECT … FOR UPDATE`) 그다음 INSERT. "교착 상태면 재시도"(좋아요 서비스 방식)와 비교해 무엇이 다른지(재시도는 증상을 흡수, 순서는 고리를 없앤다), 둘을 함께 쓰는 경우를 말할 수 있다 |
| R3 | 대가 | 같은 글의 댓글 작성이 한 줄로 선다(처리량 상한). 다른 글끼리는 막지 않는다. 좋아요 작성(같은 S→X 모양)과 댓글 작성이 동시에 오면 무엇이 일어날 수 있는지 |

## 필요한 지식

- [P18 동시성 — 재고·카운터](../docs/knowledge/P18-concurrency-inventory.md) — 원자적 증가와 잠금
- [S08 트랜잭션](../docs/knowledge/S08-transactions.md) — 잠금이 트랜잭션 끝까지 유지된다
- [R05 인덱스와 B-Tree](../docs/knowledge/R05-index-btree.md) — InnoDB는 행이 아니라 인덱스 레코드를 잠근다
- [D05 디버깅 방법론](../docs/knowledge/D05-debugging-methodology.md) — 재현 → 관찰(잠금 정보) → 가설 → 검증

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 잠금 읽기</summary>

재현 직후 `docker compose exec -T mysql mysql -uroot -proot -e "SHOW ENGINE INNODB STATUS\G" | sed -n '/LATEST DETECTED DEADLOCK/,/WE ROLL BACK/p'`. 두 트랜잭션 모두 `HOLDS THE LOCK(S): … index PRIMARY of table community.post … lock mode S locks rec but not gap`이고 `WAITING FOR THIS LOCK … lock_mode X`다. S는 누가 걸었을까 — 같은 트랜잭션에서 방금 실행한 `insert into comment`를 본다.
</details>

<details>
<summary>힌트 2 — 고치기</summary>

댓글 서비스의 작성 메서드에서 `postRepository.incrementCommentCount(postId)`를 `commentRepository.save(...)` **앞으로** 옮긴다(`comment`는 IDENTITY라 `save`가 바로 INSERT를 보낸다). UPDATE가 먼저 X를 잡으면 뒤의 INSERT 외래키 확인은 이미 쥔 잠금으로 통과하고, 같은 글의 다른 요청은 UPDATE에서 줄을 선다.
</details>
