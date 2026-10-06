# 6-1. 북마크 추가·삭제

## 상황

> "나중에 다시 보려고 글을 저장(북마크)하고 싶어요. 폴더에 넣을 수도 있고, 메모도 달고요."

좋아요와 비슷하지만 다른 점이 있다. **내 글도 저장할 수 있고**, 저장할 때 폴더와 메모를 함께 정한다. PUT은 "없으면 만들고, 있으면 폴더·메모를 바꾼다"(upsert)로 만든다.

## 만들 것

| 메서드·경로 | 의미 | 응답 |
|---|---|---|
| `PUT /api/posts/{id}/bookmark` | 북마크 상태로 만든다. 본문 `{ "folderId"?, "memo"? }` | `200` 아래 JSON |
| `DELETE /api/posts/{id}/bookmark` | 북마크를 없앤다(없어도 성공) | `204` |

```json
{ "bookmarkId": 7, "postId": 2, "bookmarked": true, "folderId": null, "memo": "[채점] 메모" }
```

| 상황 | 결과 |
|---|---|
| 이미 북마크인데 또 PUT | `200`, 행은 그대로 1개. 보낸 `folderId`·`memo`로 바꾼다(안 보내면 `null` = 기본 폴더·메모 없음) |
| `folderId`가 남의 폴더이거나 없는 폴더 | `404` |
| `memo` 200자 초과 | `400` |
| 없는 글, 2-3 규칙상 볼 수 없는 글, `PUBLISHED`가 아닌 글 | `404` |
| 토큰 없음 | `401` |

## 직접 확인

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'
bm() {   # bm <메서드> <글 id> [본문]
  if [ -n "$3" ]; then curl -s -i -X "$1" "$BASE/api/posts/$2/bookmark" -H "$K" -H 'Content-Type: application/json' -d "$3"
  else curl -s -i -X "$1" "$BASE/api/posts/$2/bookmark" -H "$K"; fi
  echo; echo ----
}

bm DELETE 2                                       # B0 처음 상태로
bm PUT 2 '{}'                                     # B1
bm PUT 2 '{"memo":"[채점] 메모"}'                  # B2
bm PUT 2 '{"folderId":11}'                        # B3 이스프링의 폴더
bm PUT 9 '{}'                                     # B4 김자바를 차단한 회원의 글
bm DELETE 2                                       # B5
bm DELETE 2                                       # B6 한 번 더
curl -i -X PUT "$BASE/api/posts/2/bookmark" -H 'Content-Type: application/json' -d '{}'   # B7 토큰 없음
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | B0 | `204` |
| C2 | B1 | `200`, `bookmarked`=true, `postId`=2, `folderId`=null, `bookmarkId`가 숫자 |
| C3 | B2 | `200`, `memo`=`[채점] 메모`, `bookmarkId`가 B1과 같다 |
| D1 | B2 뒤 `SELECT COUNT(*), MAX(memo) FROM bookmark WHERE member_id = 2 AND post_id = 2` | `1`, `[채점] 메모` |
| C4 | B3 | `404` — 남의 폴더 |
| C5 | B4 | `404` |
| C6 | B5 / B6 | `204` / `204` |
| D2 | B6 뒤 `SELECT COUNT(*) FROM bookmark WHERE member_id = 2 AND post_id = 2` | `0` |
| C7 | B7 | `401` |
| R1 | 남의 폴더 | 폴더를 id로만 찾지 않고 "내 폴더인가"까지 확인한다(`findByIdAndMember` 등). 남의 폴더가 있다는 사실이 드러나지 않게 404로 준다 |
| R2 | upsert | 있으면 고치고 없으면 만드는 흐름이 한 트랜잭션이다. 동시에 두 번 와도 UNIQUE(`member_id, post_id`)가 최후의 방어선이다 |
| R3 | 4장과 비교 | 좋아요와 북마크가 비슷한 코드를 복사해 붙인 것이 아니라 필요한 만큼만 공유한다(억지로 합치지도 않는다) |

## 필요한 지식

- [D11 — 안전한 SQL 바인딩과 IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기) — 남의 폴더 id
- [P18 — 좌석은 재고보다 유니크 제약이 핵심이다](../../docs/knowledge/P18-concurrency-inventory.md#28-좌석은-재고보다-유니크-제약이-핵심이다)
- [S06 REST API 설계 — 메서드와 상태 코드](../../docs/knowledge/S06-rest-api-clients.md#메서드와-상태-코드) — PUT과 204

## 다음 단계

[6-2. 폴더](6-2-folders.md)
