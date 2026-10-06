# 6-3. 내 북마크 목록

## 상황

> "저장한 글 목록을 보여 주세요. 폴더별로도요. 그런데 저장해 둔 글이 지워졌으면 목록에서 말없이 사라지면 안 돼요 — 사용자는 '내가 저장한 게 왜 없어졌지?' 해요. '볼 수 없는 글'이라고 표시해 주세요."

4-3(좋아요한 글)과 비슷한 커서 목록이지만 규칙 하나가 **반대**다. 좋아요 목록은 볼 수 없는 글을 **뺐고**, 북마크 목록은 **남기고 표시**한다. 사용자가 직접 모아 둔 것이기 때문이다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/me/bookmarks?folder=...&size=10&cursor=...` |
| 인증 | 필요 |
| `folder` | 생략 = 전체, `default` = 기본 폴더(`folder_id IS NULL`), 숫자 = 그 폴더(남의 폴더·없는 폴더면 `404`) |
| 정렬 | 북마크한 시각 최신순(`bookmark.created_at` DESC), 같으면 `bookmark.id` DESC |
| 커서 | 4-3과 같은 방식. 다음이 없으면 `nextCursor`=`null` |
| `size` | 생략하면 10, 1~100 |
| 볼 수 없게 된 글 | 빼지 않는다. `available: false`, `title`·`author`는 `null`(지워진 글의 제목을 흘리지 않는다) |

```json
{
  "items": [
    { "bookmarkId": 5, "postId": 13, "folderId": 12, "memo": null, "bookmarkedAt": "2026-09-26T10:00:00",
      "available": true, "title": "자유글 02", "author": { "id": 4, "nickname": "박디비" } },
    { "bookmarkId": 3, "postId": 10, "folderId": null, "memo": null, "bookmarkedAt": "2026-09-24T12:00:00",
      "available": false, "title": null, "author": null }
  ],
  "nextCursor": null
}
```

## 직접 확인

이스프링(`tok-lee`)의 시드 북마크 6개 중 10번(운영자 숨김)과 8번(삭제됨)은 지금 볼 수 없다.

```bash
BASE=http://localhost:8080
L='Authorization: Bearer tok-lee'
show() { python3 -c 'import sys,json; d=json.load(sys.stdin); print([(i["bookmarkId"], i["postId"], i["available"]) for i in d["items"]], d["nextCursor"])'; }

curl -s -H "$L" "$BASE/api/me/bookmarks?size=20" | show                 # K1 전체
curl -s -H "$L" "$BASE/api/me/bookmarks?folder=11" | show                # K2
curl -s -H "$L" "$BASE/api/me/bookmarks?folder=12" | show                # K3
curl -s -H "$L" "$BASE/api/me/bookmarks?folder=default" | show           # K4
curl -s -H "$L" "$BASE/api/me/bookmarks?size=4" | show                   # K5
NEXT=$(curl -s -H "$L" "$BASE/api/me/bookmarks?size=4" | python3 -c 'import sys,json; print(json.load(sys.stdin)["nextCursor"])')
curl -s -H "$L" "$BASE/api/me/bookmarks?size=4&cursor=$NEXT" | show      # K6
curl -i -H "$L" "$BASE/api/me/bookmarks?folder=1"                        # K7 박디비의 폴더
curl -i "$BASE/api/me/bookmarks"                                         # K8 토큰 없음
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용). 항목은 (bookmarkId, postId, available)로 적었다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | K1 | `(5,13,T) (4,2,T) (3,10,F) (2,9,T) (6,8,F) (1,5,T)` 순서, `nextCursor`=null |
| C2 | K1 | `available`=false인 두 항목(10번·8번 글)은 `title`·`author`가 `null`. 1번 항목의 `memo`=`스터디 참고` |
| C3 | K2 / K3 / K4 | `(4,2) (1,5)` / `(5,13) (6,8)` / `(3,10) (2,9)` |
| C4 | K5 / K6 | `(5) (4) (3) (2)` + `nextCursor` 있음 / `(6) (1)` + `nextCursor`=null |
| C5 | K7 / K8 | `404` / `401` |
| R1 | 4-3과의 차이 | 볼 수 없는 글을 빼지 않고 `available`로 표시한다. 같은 2-3 규칙을 쿼리 조건이 아니라 **항목별 판정**에 쓴다 |
| R2 | 정보 노출 | 볼 수 없는 글의 제목·작성자를 응답에 넣지 않는다 |
| R3 | 쿼리 | 항목마다 글·작성자를 따로 조회하지 않는다(N+1). 판정에 필요한 팔로우·차단 정보도 한 번에 가져온다 |
| R4 | 커서 재사용 | 4-3의 커서 만들기·해석 코드를 재사용한다 |

## 필요한 지식

- [W15 — 커서 경계는 완전한 정렬 순서여야 한다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#커서-경계는-완전한-정렬-순서여야-한다)
- [W13 프론트와 백엔드의 경계](../../docs/knowledge/W13-frontend-backend-boundary.md) — 무엇을 응답에 넣지 말아야 하나
- [S09 — LAZY와 N+1](../../docs/knowledge/S09-jpa-hibernate.md#lazy와-n1)

## 다음 단계

[7-1. 컨트롤러 슬라이스 테스트](../ch7-tests/7-1-controller-slice.md)
