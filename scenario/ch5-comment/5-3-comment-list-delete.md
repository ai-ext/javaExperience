# 5-3. 댓글 목록과 삭제

## 상황

> "글 아래에 댓글을 보여 주세요. 답글은 그 댓글 아래에요. 댓글을 지웠는데 답글이 달려 있으면 대화가 끊겨 보이니까 '삭제된 댓글입니다'로 자리만 남겨 주세요."

댓글을 **트리 모양**(최상위 → 답글)으로 조립하고, 삭제·차단 규칙에 따라 무엇을 보여 줄지 정한다.

## 만들 것

**목록** — `GET /api/posts/{postId}/comments`

| 항목 | 내용 |
|---|---|
| 인증 | 필요 없음(토큰이 있으면 그 회원 기준 — 2-3과 같은 방식) |
| 글 | 2-3 규칙상 볼 수 없는 글이면 `404` |
| 정렬 | 최상위 댓글은 작성 순(`created_at`, `id` 오름차순), 답글도 작성 순 |
| 지운 최상위 댓글 | 살아 있는 답글이 있으면 `deleted: true`, `content: "삭제된 댓글입니다"`, `author: null`로 **자리를 남긴다**. 답글이 없으면 목록에서 뺀다 |
| 지운 답글 | 뺀다 |
| 차단 | 보는 사람과 차단 관계인 회원의 댓글은 뺀다(최상위면 그 아래 답글까지) |

```json
[
  { "id": 1, "author": { "id": 4, "nickname": "박디비" }, "content": "트랜잭션은 서비스 메서드에 거는 게 기본이에요.",
    "createdAt": "2026-09-25T09:00:00", "deleted": false,
    "replies": [ { "id": 2, "author": { "id": 3, "nickname": "이스프링" }, "content": "감사합니다! ...", "createdAt": "2026-09-25T10:00:00" } ] },
  { "id": 4, "author": null, "content": "삭제된 댓글입니다", "createdAt": "2026-09-25T12:00:00", "deleted": true,
    "replies": [ { "id": 5, "author": { "id": 4, "nickname": "박디비" }, "content": "어떤 질문이었나요?", "createdAt": "2026-09-25T13:00:00" } ] }
]
```

**삭제** — `DELETE /api/comments/{id}`

| 항목 | 내용 |
|---|---|
| 인증·권한 | 필요. 댓글 작성자만(아니면 `403`) |
| 저장 | `comment.deleted_at`에 지금 시각(soft delete), `post.comment_count` 1 감소 |
| 응답 | `204` |
| 없거나 이미 지운 댓글 | `404` |

## 직접 확인

11번 글의 시드 댓글: 1(최상위, 박디비) ← 2(답글) · 3(최상위, **한차단** — 김자바와 차단 관계) · 4(최상위, **지움**) ← 5(답글) · 6(최상위, 지움, 답글 없음).

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'
tree() { python3 -c 'import sys,json; print([(c["id"], c["deleted"], [r["id"] for r in c["replies"]]) for c in json.load(sys.stdin)])'; }
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }

curl -s "$BASE/api/posts/11/comments" | tree                 # N1 비로그인
curl -s -H "$K" "$BASE/api/posts/11/comments" | tree         # N2 김자바
curl -i -H "$K" "$BASE/api/posts/9/comments"                 # N3 볼 수 없는 글

CID=$(curl -s -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"[채점] 지울 댓글"}' | jid)   # N4
curl -i -X DELETE "$BASE/api/comments/$CID" -H "$L"          # N5 남의 댓글
curl -i -X DELETE "$BASE/api/comments/$CID" -H "$K"          # N6 작성자
curl -i -X DELETE "$BASE/api/comments/$CID" -H "$K"          # N7 다시
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). 5-2 채점에서 1번 댓글에 김자바의 답글이 더 달려 있을 수 있다 — 그래도 아래 기대는 같다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | N1 | `200`. 최상위 id 순서 `1, 3, 4`. 1번의 답글 첫 항목은 2번. 4번은 `deleted`=true, `content`=`삭제된 댓글입니다`, `author`=null, 답글 [5]. 6번은 없다 |
| C2 | N2 | `200`. 최상위 id 순서 `1, 4` — 3번(한차단)이 빠진다 |
| C3 | N3 | `404` |
| D1 | N4 **전** `SELECT comment_count FROM post WHERE id = 3` | 값 c를 기억 |
| C4 | N4 / N5 / N6 / N7 | `201` / `403` / `204` / `404` |
| D2 | N7 뒤 같은 쿼리 | c — 달았다 지웠으니 원래대로 |
| D3 | `SELECT deleted_at IS NOT NULL FROM comment WHERE id = {N4 응답 id}` | `1` — 행은 남아 있다 |
| R1 | 쿼리 수 | 댓글을 한두 번의 쿼리로 읽어서 메모리에서 트리로 조립한다. 댓글마다 답글을 따로 조회하지 않는다(N+1) |
| R2 | 표시 규칙 | 자리 남기기·빼기·차단 규칙이 한 곳에 모여 있고 테스트하기 쉽다(엔티티 → 트리 DTO 변환 함수) |
| R3 | 삭제 권한 | 작성자 확인이 서비스에 있다 |
| R4 | 숫자 | 삭제 시 `comment_count` 감소가 같은 트랜잭션이다 |

## 필요한 지식

- [S09 — LAZY와 N+1](../../docs/knowledge/S09-jpa-hibernate.md#lazy와-n1) — 트리를 만들다 생기는 N+1
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — 저장 모양(평평한 행)과 응답 모양(트리)이 다르다
- [D11 — 인증과 인가](../../docs/knowledge/D11-web-security-basics.md#32-인증과-인가-신원-확인-후-객체까지-확인)
- [J25 자료구조 지도](../../docs/knowledge/J25-data-structures-map.md) — `Map<Long, List<…>>`로 묶기

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 트리 조립</summary>

그 글의 댓글을 작성자와 함께 한 번에 읽는다(`join fetch c.member`). `Map<Long, List<Comment>> repliesByParent`로 답글을 부모 id별로 묶은 뒤, 최상위 댓글을 돌면서 규칙(지움·차단)에 따라 DTO를 만든다. "살아 있는 답글이 있나"는 차단으로 빠진 답글을 제외하고 센다.
</details>

## 다음 단계

[6-1. 북마크 추가·삭제](../ch6-bookmark/6-1-bookmark.md)
