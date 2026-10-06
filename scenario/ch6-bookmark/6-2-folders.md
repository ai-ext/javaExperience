# 6-2. 폴더 — 최대 10개, 이름 중복 불가

## 상황

> "북마크를 폴더로 정리하고 싶어요. 폴더는 10개까지, 같은 이름은 못 만들게요. 폴더를 지우면 안에 있던 북마크는 지우지 말고 기본 폴더로 옮겨 주세요."

규칙이 여럿인 작은 CRUD다. **한도·중복·소유자 확인**을 각각 어디서 어떻게 막을지가 핵심이다.

## 만들 것

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `GET /api/me/bookmark-folders` | 내 폴더 목록(만든 순) | `200` `[ { "id": 11, "name": "스프링 공부", "bookmarkCount": 2 } ]` |
| `POST /api/me/bookmark-folders` | 만들기 `{ "name": "..." }` | `201`, `Location: /api/me/bookmark-folders/{id}`, `{ "id", "name" }` |
| `PATCH /api/me/bookmark-folders/{id}` | 이름 바꾸기 `{ "name": "..." }` | `200` `{ "id", "name" }` |
| `DELETE /api/me/bookmark-folders/{id}` | 지우기 — 안의 북마크는 기본 폴더(`folder_id = NULL`)로 옮긴다 | `204` |
| `PATCH /api/me/bookmarks/{bookmarkId}` | 북마크를 다른 폴더로 `{ "folderId": 12 }`(`null`이면 기본 폴더) | `200` 6-1의 JSON |

| 상황 | 결과 |
|---|---|
| 이름이 비었거나 50자 초과(앞뒤 공백은 잘라서 판단) | `400` |
| 내 폴더 중 같은 이름이 이미 있음 | `409` |
| 폴더가 이미 10개인데 또 만들기 | `400` |
| 남의 폴더·남의 북마크, 없는 id | `404` |
| 토큰 없음 | `401` |

모든 API에 토큰이 필요하다.

## 직접 확인

이스프링은 폴더 2개("스프링 공부" 11번·"나중에 읽기" 12번), 박디비는 폴더 10개(한도)를 가지고 있다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; P='Authorization: Bearer tok-park'
J='Content-Type: application/json'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["'"${1:-id}"'"])'; }
NAME="[채점] 폴더 $(date +%H%M%S)"

curl -s -H "$L" "$BASE/api/me/bookmark-folders"; echo                                                     # F1
curl -i -X POST "$BASE/api/me/bookmark-folders" -H "$P" -H "$J" -d '{"name":"[채점] 열한 번째"}'           # F2 한도
FID=$(curl -s -X POST "$BASE/api/me/bookmark-folders" -H "$K" -H "$J" -d "{\"name\":\"$NAME\"}" | jid)     # F3
curl -i -X POST "$BASE/api/me/bookmark-folders" -H "$K" -H "$J" -d "{\"name\":\"$NAME\"}"                 # F4 같은 이름
curl -i -X PATCH "$BASE/api/me/bookmark-folders/11" -H "$K" -H "$J" -d '{"name":"[채점] 남의 폴더"}'      # F5
BID=$(curl -s -X PUT "$BASE/api/posts/3/bookmark" -H "$K" -H "$J" -d '{}' | jid bookmarkId)               # F6
curl -s -X PATCH "$BASE/api/me/bookmarks/$BID" -H "$K" -H "$J" -d "{\"folderId\":$FID}"; echo             # F7 폴더로 옮기기
curl -i -X DELETE "$BASE/api/me/bookmark-folders/$FID" -H "$K"                                            # F8 폴더 지우기
curl -i -X PATCH "$BASE/api/me/bookmarks/1" -H "$K" -H "$J" -d '{"folderId":null}'                        # F9 남의 북마크
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{FID}`·`{BID}`는 F3·F6 응답의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | F1 | `200`, `[{11, "스프링 공부", 2}, {12, "나중에 읽기", 2}]` 순서 |
| C2 | F2 | `400` — 박디비는 이미 10개 |
| C3 | F3 / F4 | `201`(`Location` 있음) / `409` |
| C4 | F5 | `404` |
| C5 | F7 | `200`, `folderId`={FID} |
| C6 | F8 | `204` |
| D1 | F8 뒤 `SELECT folder_id FROM bookmark WHERE id = {BID}` | `NULL` — 기본 폴더로 옮겨졌다 |
| D2 | F8 뒤 `SELECT COUNT(*) FROM bookmark_folder WHERE id = {FID}` | `0` |
| C7 | F9 | `404` |
| D3 | `SELECT COUNT(*) FROM bookmark_folder WHERE member_id = 4` | `10` — 한도 초과 요청이 아무것도 만들지 않았다 |
| R1 | 중복 이름 | 서비스에서 먼저 확인하더라도, 동시에 두 요청이 오면 DB의 UNIQUE(`member_id, name`)가 막는다는 것을 알고 그 예외를 409로 바꾼다 |
| R2 | 한도 | "10개 이하" 확인 위치와 한계(동시에 두 개를 만들면 11개가 될 수 있다)를 설명할 수 있다 |
| R3 | 폴더 삭제 | 북마크 옮기기와 폴더 삭제가 한 트랜잭션이다. 옮기기는 북마크마다가 아니라 UPDATE 한 번으로 한다 |
| R4 | 소유자 | 모든 폴더·북마크 조회가 "내 것" 조건을 포함한다 |

## 필요한 지식

- [W10 — 서비스와 DB: 안내 검사와 최종 고유성](../../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성) — 409를 어디서 만드나
- [W10 — 중복 검사와 경쟁 조건](../../docs/knowledge/W10-where-to-validate.md#중복-검사와-경쟁-조건)
- [D11 — IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기)
- [W08 예외는 어디서 잡나](../../docs/knowledge/W08-where-to-handle-exceptions.md) — `DataIntegrityViolationException`을 409로

## 다음 단계

[6-3. 내 북마크 목록](6-3-my-bookmarks.md)
