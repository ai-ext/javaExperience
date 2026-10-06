# 3-2. 삭제 — soft delete

## 상황

> "삭제 버튼 누르면 글이 없어져야 해요. 근데 운영팀이 신고 처리하려면 지운 글도 남아 있어야 한대요."

행을 진짜로 지우지 않고 **"지웠다"는 표시만 남긴다**(soft delete). 그러면 사용자에게는 사라진 것처럼 보이고, 운영팀은 기록을 볼 수 있다. 달려 있던 좋아요·댓글 행도 그대로 남는다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `DELETE /api/posts/{id}` |
| 인증 | 필요 |
| 지울 수 있는 사람 | 작성자, 또는 운영자(`ADMIN`) |
| 응답 | `204 No Content`(본문 없음) |
| 저장 | `post.deleted_at`에 지금 시각. 행·좋아요·댓글·태그 연결은 지우지 않는다 |

| 상황 | 결과 |
|---|---|
| 없는 글, 이미 지운 글, 볼 수 없는 글 | `404` |
| 작성자도 운영자도 아님 | `403` |

지운 뒤에는 상세(`GET`)·수정(`PATCH`)·다시 삭제가 모두 `404`이고, 목록에서도 빠진다(2-3 규칙 1번).

## 직접 확인

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; A='Authorization: Bearer tok-admin'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }
mk() { curl -s -X POST "$BASE/api/posts" -H "$1" -H 'Content-Type: application/json' \
  -d "{\"boardSlug\":\"dev\",\"title\":\"$2\",\"content\":\"삭제 확인용\",\"tags\":[],\"visibility\":\"PUBLIC\"}" | jid; }

Y=$(mk "$K" '[채점] 삭제용'); echo "Y=$Y"                                         # S0
curl -i -X DELETE "$BASE/api/posts/$Y" -H "$L"                                     # S1 남의 글
curl -i -X DELETE "$BASE/api/posts/$Y" -H "$K"                                     # S2 작성자
curl -i "$BASE/api/posts/$Y"                                                       # S3 지운 뒤 조회
curl -i -X DELETE "$BASE/api/posts/$Y" -H "$K"                                     # S4 다시 삭제
curl -s "$BASE/api/boards/dev/posts?size=50" | python3 -c "import sys,json; print($Y in [i['id'] for i in json.load(sys.stdin)['items']])"   # S5 목록에 있나
Z=$(mk "$L" '[채점] 운영자가 지울 글'); echo "Z=$Z"
curl -i -X DELETE "$BASE/api/posts/$Z" -H "$A"                                     # S6 운영자
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{Y}`·`{Z}`는 직접 확인에서 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | S0 | `201` |
| C2 | S1 | `403` |
| C3 | S2 | `204`, 본문 없음 |
| C4 | S3 | `404` |
| C5 | S4 | `404` |
| C6 | S5 | `False` — 목록에 없다 |
| C7 | S6(운영자가 이스프링 글 삭제) | `204` |
| D1 | `SELECT deleted_at IS NOT NULL, title FROM post WHERE id = {Y}` | `1`, `[채점] 삭제용` — 행이 남아 있다 |
| D2 | `SELECT deleted_at IS NOT NULL FROM post WHERE id = {Z}` | `1` |
| R1 | 지운 글 거르기 | `deleted_at IS NULL` 조건을 모든 조회에 빠짐없이 건다(상세·목록·수정·좋아요…). 빠뜨리기 쉬운 곳을 한 곳(2-3 규칙 클래스, 또는 `@SQLRestriction` 등)으로 모았다 |
| R2 | 권한 | "작성자 또는 운영자" 판단이 서비스에 있다 |
| R3 | 두 번째 삭제 | 두 번째 삭제를 404로 한 이유(이미 없는 자원)를 설명할 수 있다. 204로 하는 설계도 있다는 것을 안다 |
| R4 | 연관 데이터 | 좋아요·댓글을 같이 지우지 않았다(cascade 삭제나 `orphanRemoval`로 날아가지 않는다) |

## 필요한 지식

- [P20 — cascade, orphanRemoval, 다대다](../../docs/knowledge/P20-jpa-entity-mapping.md#25-cascade-orphanremoval-다대다) — 같이 지워지면 안 되는 것
- [S09 JPA·Hibernate](../../docs/knowledge/S09-jpa-hibernate.md)
- [W08 예외는 어디서 잡나](../../docs/knowledge/W08-where-to-handle-exceptions.md)
- [R07 백업과 복원](../../docs/knowledge/R07-backup-restore.md) — "지운 데이터"를 남겨 두는 다른 이유

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 엔티티에 삭제 메서드</summary>

`post.delete(now)`가 `deletedAt`을 채우게 하고, 리포지토리의 `delete()`는 쓰지 않는다. 지운 글을 거르는 조건은 2-3의 규칙 클래스에 이미 있다면 상세·목록은 자동으로 따라온다. 수정(`PATCH`)·좋아요처럼 "글을 찾는" 다른 경로도 같은 조회 메서드를 쓰게 한다.
</details>

## 다음 단계

[4-1. 좋아요·취소(멱등)](../ch4-like/4-1-like-toggle.md)
