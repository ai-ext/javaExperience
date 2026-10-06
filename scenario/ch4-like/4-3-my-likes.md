# 4-3. 내가 좋아요한 글 — 커서 페이징

## 상황

> "마이페이지에 '좋아요한 글' 탭을 만들어요. 최근에 누른 순서로, 스크롤 내리면 계속 불러오게요."

무한 스크롤에는 2-2의 페이지 번호(OFFSET) 방식이 잘 맞지 않는다. 스크롤하는 사이에 새 좋아요가 생기면 다음 페이지가 밀려 같은 글이 또 나오고, 뒤로 갈수록 느려진다. 대신 **"마지막으로 받은 것 다음부터"**를 뜻하는 커서를 돌려준다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/me/likes?size=10&cursor=...` |
| 인증 | 필요(없으면 `401`) |
| 정렬 | **좋아요를 누른 시각** 최신순(`post_like.created_at` DESC), 같으면 `post_like.id` DESC |
| 대상 | 내가 좋아요한 글 중 **지금 볼 수 있는 글만**(2-3 규칙). 지워졌거나 볼 수 없게 된 글은 뺀다 |
| `size` | 생략하면 10, 1~100(밖이면 `400`) |
| `cursor` | 첫 요청은 생략. 다음 요청부터는 직전 응답의 `nextCursor`를 그대로 보낸다 |
| 응답 | 아래 JSON. **다음 항목이 없으면 `nextCursor`는 `null`** |

```json
{
  "items": [
    { "postId": 14, "title": "자유글 03", "author": { "id": 3, "nickname": "이스프링" }, "likedAt": "2026-09-27T12:00:00" }
  ],
  "nextCursor": "MjAyNi0wOS0yN1QxMjowMDowMHw4"
}
```

커서 내용은 여러분이 정한다(예: 마지막 항목의 `likedAt`과 좋아요 id를 이어 Base64로). 클라이언트는 열어 보지 않고 그대로 돌려보낸다.

## 직접 확인

박디비(`tok-park`)로 확인한다. 박디비는 시드에서 글 8개에 좋아요를 눌렀고, 그중 6번(팔로워 공개 — 박디비는 팔로워가 아님)과 8번(삭제됨)은 지금 볼 수 없다.

```bash
BASE=http://localhost:8080
P='Authorization: Bearer tok-park'
show() { python3 -c 'import sys,json; d=json.load(sys.stdin); print([i["postId"] for i in d["items"]], d["nextCursor"])'; }

curl -s -H "$P" "$BASE/api/me/likes?size=3" | show                     # M1
NEXT=$(curl -s -H "$P" "$BASE/api/me/likes?size=3" | python3 -c 'import sys,json; print(json.load(sys.stdin)["nextCursor"])')
curl -s -H "$P" "$BASE/api/me/likes?size=3&cursor=$NEXT" | show         # M2
curl -s -H "$P" "$BASE/api/me/likes?size=20" | show                    # M3
curl -i "$BASE/api/me/likes"                                            # M4 토큰 없음
curl -i -H "$P" "$BASE/api/me/likes?size=0"                            # M5
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | M1 | `200`, `postId` 순서 `14, 12, 11`, `nextCursor`가 `null`이 아니다 |
| C2 | M2 | `200`, `postId` 순서 `9, 4, 2`, `nextCursor`=`null` |
| C3 | M3 | `200`, `postId` 순서 `14, 12, 11, 9, 4, 2`(6개 — 6번·8번 없음), `nextCursor`=`null` |
| C4 | M3 | 첫 항목 `likedAt`이 `2026-09-27T12:00:00`(소수점 초 무관), `author`=이스프링(3) |
| C5 | M4 | `401` |
| C6 | M5 | `400` |
| R1 | 커서 조건 | `WHERE (created_at, id) < (커서값)` 형태의 키셋 조건을 쓴다. OFFSET을 쓰지 않는다. 동률(같은 시각) 처리를 위해 id까지 비교한다 |
| R2 | 다음 여부 | `size + 1`개를 읽어서 다음이 있는지 판단하는 식으로, 마지막 페이지에서 `nextCursor`를 `null`로 준다 |
| R3 | 필터 위치 | "볼 수 있는 글만"을 쿼리에서 거른다. 메모리에서 거르면 한 페이지가 `size`보다 적게 오면서 `nextCursor`는 남는 문제가 생긴다 |
| R4 | 인덱스 | `post_like`에 `(member_id, created_at, id)` 인덱스가 없어서 정렬에 filesort가 생긴다는 것을 `EXPLAIN`으로 확인했다(인덱스를 추가했다면 스키마 변경 방법도 설명할 수 있다) |

## 필요한 지식

- [W15 — 커서 경계는 완전한 정렬 순서여야 한다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#커서-경계는-완전한-정렬-순서여야-한다)
- [W15 — OFFSET은 위치 번호를 알아내기 위해 앞부분을 지나간다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#offset은-위치-번호를-알아내기-위해-앞부분을-지나간다)
- [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md) — 정렬에 인덱스를 쓰는 조건
- [P21 QueryDSL 설정과 동적 쿼리](../../docs/knowledge/P21-querydsl-setup.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 키셋 조건</summary>

JPQL에는 튜플 비교가 없으니 `l.createdAt < :at or (l.createdAt = :at and l.id < :id)`로 풀어 쓴다. 첫 페이지는 이 조건 없이, `order by l.createdAt desc, l.id desc`로 `size + 1`개를 가져온다. 2-3의 "볼 수 있는 글" 조건을 같은 쿼리에 붙인다.
</details>

## 다음 단계

[5-1. 댓글 작성](../ch5-comment/5-1-create-comment.md)
