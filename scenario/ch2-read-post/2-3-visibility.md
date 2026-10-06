# 2-3. 볼 수 있는 글만 — 임시저장·삭제·숨김·팔로워·차단

## 상황

지금은 id만 알면 누구나 남의 임시저장 글도, 지운 글도 볼 수 있다. 실제 커뮤니티라면 사고다.

> "임시저장 글은 쓴 사람만, 팔로워 공개 글은 팔로워만 봐야 해요. 차단한 사람 글은 서로 안 보여야 하고요."

**"이 사람이 이 글을 볼 수 있나"** 규칙 하나를 만들고, 상세와 목록 양쪽에 똑같이 적용한다.

## 만들 것

**누가 보는가** — 조회 API는 토큰이 없어도 된다.

| 요청 | 보는 사람 |
|---|---|
| `Authorization` 헤더 없음 | 비로그인 |
| 올바른 토큰 | 그 토큰의 회원 |
| 헤더는 있는데 잘못된·만료·폐기 토큰 | `401`(비로그인으로 취급하지 않는다) |

**볼 수 있나** (보는 사람 v, 글 p) — 아래를 모두 만족해야 볼 수 있다.

1. 삭제된 글(`deleted_at` 있음)이 아니다 — 작성자 본인도 못 본다.
2. `status`가 `PUBLISHED`이다. 단, `DRAFT`(임시저장)는 작성자만, `HIDDEN`(운영자 숨김)은 운영자(`ADMIN`)만 볼 수 있다.
3. `visibility`가 `FOLLOWERS`면 작성자 본인이거나 작성자를 팔로우하는 회원이어야 한다.
4. v와 작성자 사이에 차단이 없다(어느 쪽이 차단했든).
5. 비로그인은 `PUBLISHED` + `PUBLIC`만 볼 수 있다.

| 화면 | 적용 |
|---|---|
| 상세 `GET /api/posts/{id}` | 볼 수 없으면 **`404`**. 403이 아니다 — 글이 있다는 사실도 숨긴다. 404일 때 조회수는 오르지 않는다 |
| 목록 `GET /api/boards/{slug}/posts` | 볼 수 있는 `PUBLISHED` 글만. 자기 임시저장 글도 목록에는 넣지 않는다. `totalElements`도 이 기준 |

## 직접 확인

```bash
BASE=http://localhost:8080
get() { curl -s -o /dev/null -w "%{http_code}\n" "$@"; }
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; P='Authorization: Bearer tok-park'
H='Authorization: Bearer tok-han';    A='Authorization: Bearer tok-admin'

# 상세 — 상태 코드만
get "$BASE/api/posts/6"; get -H "$K" "$BASE/api/posts/6"; get -H "$P" "$BASE/api/posts/6"; get -H "$L" "$BASE/api/posts/6"   # V1
get -H "$P" "$BASE/api/posts/7"; get -H "$K" "$BASE/api/posts/7"; get "$BASE/api/posts/7"                                     # V2
get -H "$L" "$BASE/api/posts/8"; get "$BASE/api/posts/8"                                                                         # V3
get "$BASE/api/posts/9"; get -H "$K" "$BASE/api/posts/9"; get -H "$H" "$BASE/api/posts/9"                                     # V4
get -H "$A" "$BASE/api/posts/10"; get -H "$P" "$BASE/api/posts/10"                                                              # V5
get -H 'Authorization: Bearer no-such-token' "$BASE/api/posts/2"                                                                 # V6

# 목록 — id만 뽑아 보기
ids() { python3 -c 'import sys,json; print([i["id"] for i in json.load(sys.stdin)["items"]])'; }
curl -s "$BASE/api/boards/free/posts?size=20" | ids              # V7 비로그인
curl -s -H "$K" "$BASE/api/boards/free/posts?size=20" | ids      # V8 김자바
curl -s -H "$P" "$BASE/api/boards/free/posts?size=20" | ids      # V9 박디비
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | V1 — 6번(이스프링의 팔로워 공개 글): 비로그인 / 김자바(팔로워) / 박디비 / 이스프링(작성자) | `404` / `200` / `404` / `200` |
| C2 | V2 — 7번(박디비의 임시저장): 박디비 / 김자바 / 비로그인 | `200` / `404` / `404` |
| C3 | V3 — 8번(삭제됨): 이스프링(작성자) / 비로그인 | `404` / `404` |
| C4 | V4 — 9번(김자바를 차단한 한차단의 글): 비로그인 / 김자바 / 한차단 | `200` / `404` / `200` |
| C5 | V5 — 10번(운영자 숨김): 운영자 / 박디비(작성자) | `200` / `404` |
| C6 | V6 — 없는 토큰으로 공개 글 조회 | `401` |
| C7 | V7 | 13개: `21~12, 9, 5, 4` (`totalElements`=13) |
| C8 | V8 | 13개: `21~12, 6, 5, 4` — 팔로워 공개 6번이 보이고 차단 9번이 빠진다 |
| C9 | V9 | 13개: `21~12, 9, 5, 4` — 자기 임시저장 7번은 목록에 없다 |
| D1 | V3 **전후** `SELECT view_count FROM post WHERE id = 8` | 값이 그대로 — 404면 조회수가 오르지 않는다 |
| R1 | 규칙 한 곳 | 위 규칙이 한 클래스(예: `PostAccessPolicy`)에 모여 있다. 상세는 자바 코드로 판정하고 목록은 쿼리 조건으로 걸러야 하는데, 두 곳이 같은 규칙을 따르도록 관리한다 |
| R2 | 404 | 볼 수 없을 때 403이 아니라 404를 주는 이유를 코드나 주석으로 알 수 있다 |
| R3 | 목록 필터 위치 | 목록 필터링을 메모리(`stream().filter`)가 아니라 쿼리에서 한다 — 메모리에서 거르면 페이지 크기와 `totalElements`가 틀어진다 |
| R4 | 선택적 인증 | "헤더 없음 = 비로그인"과 "헤더가 잘못됨 = 401"을 구분한다 |

## 필요한 지식

- [D11 웹 보안 기초 — 인증과 인가](../../docs/knowledge/D11-web-security-basics.md#32-인증과-인가-신원-확인-후-객체까지-확인) — "객체까지 확인"이 바로 이 단계
- [D11 — 403과 404 중 무엇을 반환하나](../../docs/knowledge/D11-web-security-basics.md#q1-인증과-인가를-실제-api에서-어떻게-나누나)
- [P21 QueryDSL — 동적 조건은 null 반환 메서드로](../../docs/knowledge/P21-querydsl-setup.md#25-동적-조건은-null-반환-메서드로-만든다) — 보는 사람에 따라 조건이 바뀌는 쿼리
- [S10 — Specification과 Projection](../../docs/knowledge/S10-spring-data-query.md#specification과-projection은-서로-다른-문제를-푼다)
- [W13 프론트와 백엔드의 경계](../../docs/knowledge/W13-frontend-backend-boundary.md) — 화면에서 숨기는 것과 서버가 막는 것

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 상세와 목록에 같은 규칙</summary>

상세: `policy.canView(viewer, post)`를 자바로 판정한다. 목록: 같은 규칙을 WHERE 조건으로 옮긴다 — `status = PUBLISHED`, `(visibility = PUBLIC OR author = :viewer OR EXISTS(팔로우))`, `NOT EXISTS(차단)`. JPQL이면 `EXISTS (SELECT 1 FROM Follow f WHERE ...)`, QueryDSL이면 `JPAExpressions`로 서브쿼리를 만든다. 규칙을 바꿀 때 두 곳을 같이 고치도록 같은 클래스 옆에 둔다.
</details>

<details>
<summary>힌트 2 — 비로그인</summary>

보는 사람을 `null`(또는 `Viewer.anonymous()`)로 표현하고, 쿼리 조건에서는 비로그인일 때 "PUBLIC만"으로 분기한다.
</details>

## 다음 단계

[2-4. 쿼리 수 줄이기(N+1)](2-4-n-plus-1.md)
