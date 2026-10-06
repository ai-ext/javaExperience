# 4-1. 좋아요·취소(멱등)

## 상황

> "하트 누르면 좋아요, 다시 누르면 취소예요. 근데 네트워크가 느리면 사용자가 두 번 누르거나 앱이 자동으로 다시 보내요."

같은 요청이 두 번 와도 결과가 같아야 한다(**멱등**). "누를 때마다 뒤집기(toggle)"로 만들면 두 번 오면 원래대로 돌아가 버린다. 그래서 **좋아요(PUT)와 취소(DELETE)를 따로** 둔다.

## 만들 것

| 메서드·경로 | 의미 | 응답 |
|---|---|---|
| `PUT /api/posts/{id}/like` | 좋아요 상태로 만든다 | `200` `{ "postId": 3, "liked": true, "likeCount": 1 }` |
| `DELETE /api/posts/{id}/like` | 좋아요가 아닌 상태로 만든다 | `200` `{ "postId": 3, "liked": false, "likeCount": 0 }` |

| 상황 | 결과 |
|---|---|
| 이미 좋아요인데 또 PUT / 이미 아닌데 또 DELETE | `200`, 상태·숫자 그대로(행이 늘거나 줄지 않는다) |
| 내 글에 좋아요 | `400` |
| 없는 글, 2-3 규칙상 볼 수 없는 글, `PUBLISHED`가 아닌 글 | `404` |
| 토큰 없음 / 정지 회원 | `401` / `403` |

- `post_like`에 (글, 회원) 한 행이 있으면 좋아요 상태다. 테이블에는 이미 `UNIQUE (post_id, member_id)`가 걸려 있다.
- `post.like_count`는 행 수와 항상 같아야 한다. 응답의 `likeCount`는 바뀐 뒤의 값이다.

## 직접 확인

김자바(`tok-kimjava`)가 박디비의 3번 글에 누른다. 처음 상태가 어떻든 같은 결과가 나오도록 **취소부터** 한다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; C='Authorization: Bearer tok-choi'

curl -s -X DELETE "$BASE/api/posts/3/like" -H "$K"; echo     # K0 처음 상태로
curl -s -X PUT    "$BASE/api/posts/3/like" -H "$K"; echo     # K1
curl -s -X PUT    "$BASE/api/posts/3/like" -H "$K"; echo     # K2 한 번 더
curl -s -X DELETE "$BASE/api/posts/3/like" -H "$K"; echo     # K3
curl -s -X DELETE "$BASE/api/posts/3/like" -H "$K"; echo     # K4 한 번 더
curl -i -X PUT "$BASE/api/posts/2/like" -H "$L"              # K5 이스프링이 자기 글(2번)에
curl -i -X PUT "$BASE/api/posts/9/like" -H "$K"              # K6 김자바를 차단한 회원의 글
curl -i -X PUT "$BASE/api/posts/7/like" -H "$K"              # K7 남의 임시저장 글
curl -i -X PUT "$BASE/api/posts/3/like"                      # K8 토큰 없음
curl -i -X PUT "$BASE/api/posts/3/like" -H "$C"              # K9 정지 회원
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). n은 K0 응답의 `likeCount`다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | K0 | `200`, `liked`=false |
| C2 | K1 | `200`, `liked`=true, `likeCount`=n+1 |
| C3 | K2 | `200`, `liked`=true, `likeCount`=n+1(그대로) |
| D1 | K2 뒤 `SELECT COUNT(*) FROM post_like WHERE post_id = 3 AND member_id = 2` | `1` |
| C4 | K3 | `200`, `liked`=false, `likeCount`=n |
| C5 | K4 | `200`, `liked`=false, `likeCount`=n(그대로) |
| D2 | K4 뒤 `SELECT p.like_count = (SELECT COUNT(*) FROM post_like l WHERE l.post_id = 3) FROM post p WHERE p.id = 3` | `1` — 숫자와 행 수가 같다 |
| C6 | K5 | `400` |
| C7 | K6 / K7 | `404` / `404` |
| C8 | K8 / K9 | `401` / `403` |
| R1 | 멱등 | PUT·DELETE가 "현재 상태를 확인하고 필요할 때만 바꾸는" 방식이다. 이미 있는데 INSERT를 시도해 500(중복 키)이 나지 않는다 |
| R2 | 숫자 맞추기 | `like_count`를 행 추가·삭제와 같은 트랜잭션에서 바꾼다 |
| R3 | 규칙 재사용 | "볼 수 있는 글인가"를 2-3의 규칙으로 확인한다 |
| R4 | 응답 | 응답의 `likeCount`가 실제 DB 값과 같다(메모리 계산만 믿지 않는다) |

## 필요한 지식

- [P18 — 중복 요청은 동시성 락이 해결하지 않는다](../../docs/knowledge/P18-concurrency-inventory.md#27-중복-요청은-동시성-락이-해결하지-않는다)
- [P18 — 좌석은 재고보다 유니크 제약이 핵심이다](../../docs/knowledge/P18-concurrency-inventory.md#28-좌석은-재고보다-유니크-제약이-핵심이다) — `post_like`의 UNIQUE와 같은 이야기
- [S06 REST API 설계 — 메서드와 상태 코드](../../docs/knowledge/S06-rest-api-clients.md#메서드와-상태-코드) — PUT·DELETE가 멱등인 이유
- [W11 트랜잭션은 왜 서비스 계층에 거나](../../docs/knowledge/W11-why-tx-in-service.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 흐름</summary>

PUT: 글 찾기(2-3 규칙) → 내 글이면 400 → `existsByPostAndMember`가 false일 때만 `PostLike` 저장 + `likeCount` 1 증가 → 현재 상태 반환. DELETE는 반대. 동시에 두 번 오는 경우는 다음 단계(4-2)에서 다룬다.
</details>

## 다음 단계

[4-2. 동시에 눌러도 맞는 like_count](4-2-like-concurrency.md)
