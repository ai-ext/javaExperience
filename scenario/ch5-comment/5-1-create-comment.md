# 5-1. 댓글 작성

## 상황

> "글 아래에 댓글을 달 수 있게 해 주세요. 목록 화면에 댓글 수도 보여야 해요."

댓글 저장 자체는 1장과 비슷하다. 새로운 점은 **다른 테이블의 숫자(`post.comment_count`)를 같이 맞춰야 한다**는 것이다. 둘 중 하나만 반영되면 목록의 댓글 수가 틀어진다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `POST /api/posts/{postId}/comments` |
| 인증 | 필요 |
| 요청 | `{ "content": "좋은 글 감사합니다" }` |
| 응답 | `201`, `Location: /api/comments/{id}`, 아래 JSON |
| 함께 바꿀 것 | `post.comment_count` 1 증가(같은 트랜잭션) |

```json
{ "id": 7, "postId": 3, "parentId": null, "author": { "id": 2, "nickname": "김자바" }, "content": "좋은 글 감사합니다", "createdAt": "2026-10-06T18:00:00" }
```

| 상황 | 결과 |
|---|---|
| `content`가 없음·공백·1000자 초과 | `400` |
| 없는 글, 2-3 규칙상 볼 수 없는 글, `PUBLISHED`가 아닌 글 | `404` |
| 토큰 없음 / 정지 회원 | `401` / `403` |

`parentId`(답글)는 다음 단계(5-2)에서 다룬다.

## 직접 확인

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'
cc() { docker compose exec -T mysql mysql -ucommunity -pcommunity community -N -e "SELECT comment_count FROM post WHERE id = $1" 2>/dev/null; }

cc 3                                                                                                   # 전
curl -i -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"[채점] 댓글"}'    # W1
cc 3                                                                                                   # 후
curl -i -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"   "}'            # W2
LONG=$(printf 'a%.0s' $(seq 1 1001))
curl -i -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d "{\"content\":\"$LONG\"}"      # W3
curl -i -X POST "$BASE/api/posts/9/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"[채점] 차단"}'     # W4
curl -i -X POST "$BASE/api/posts/8/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"[채점] 삭제글"}'   # W5
curl -i -X POST "$BASE/api/posts/3/comments" -H 'Content-Type: application/json' -d '{"content":"[채점] 토큰 없음"}'        # W6
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). c는 W1 전에 조회한 3번 글의 `comment_count`다.

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | W1 **전** `SELECT comment_count FROM post WHERE id = 3` | 값 c를 기억 |
| C1 | W1 | `201`, `Location`이 `/api/comments/{응답 id}`로 끝난다. `postId`=3, `parentId`=null, `author.id`=2, `content`=`[채점] 댓글` |
| D2 | W6까지 끝난 뒤 같은 쿼리 | c+1 — 실패한 요청은 숫자를 바꾸지 않았다 |
| D3 | `SELECT p.comment_count = (SELECT COUNT(*) FROM comment c WHERE c.post_id = 3 AND c.deleted_at IS NULL) FROM post p WHERE p.id = 3` | `1` |
| C2 | W2 / W3 | `400` / `400` |
| C3 | W4 / W5 | `404` / `404` |
| C4 | W6 | `401` |
| R1 | 숫자 갱신 | 댓글 저장과 `comment_count` 증가가 한 트랜잭션이다. 증가는 4-2처럼 DB에서 한 번에(`+ 1`) 한다 |
| R2 | 연관관계 | `Comment` → `Post`, `Member`가 `@ManyToOne(LAZY)`. 글 엔티티에 댓글 컬렉션을 두었다면 그 이유가 있다 |
| R3 | 응답 | 엔티티 대신 DTO를 돌려준다 |

## 필요한 지식

- [W11 트랜잭션은 왜 서비스 계층에 거나](../../docs/knowledge/W11-why-tx-in-service.md) — 두 테이블을 함께 바꿀 때
- [P18 — 가장 싼 해결책: 조건부 원자 UPDATE](../../docs/knowledge/P18-concurrency-inventory.md#22-가장-싼-해결책-조건부-원자-update)
- [P20 — 연관관계의 주인](../../docs/knowledge/P20-jpa-entity-mapping.md#24-연관관계의-주인)
- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md)

## 다음 단계

[5-2. 답글(1단계까지)](5-2-reply.md)
