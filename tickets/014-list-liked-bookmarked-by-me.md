# T-014. 글 목록에 내 좋아요·북마크 표시

> 난이도 중급 · 유형 기존 API 변경 · DB community · 예상 60분

## 티켓

> **요청자** 프론트 팀 · **배경** 목록 카드의 하트·책갈피 아이콘을 "내가 눌렀는지"에 따라 채우고 싶다. 지금은 목록을 받은 뒤 카드마다 상세 API를 한 번씩 더 불러 확인하고 있어서, 목록 하나에 요청이 20번 넘게 나간다.

- 게시판 글 목록과 조합 검색 응답의 각 항목에 "내가 좋아요했는지"·"내가 북마크했는지"를 넣어 주세요. 비로그인은 둘 다 `false`입니다.
- 서버도 항목마다 따로 조회하면 같은 문제를 서버로 옮긴 것뿐입니다. 목록 크기(최대 50)와 상관없이 쿼리 수가 일정해야 합니다.
- **완료 조건**: 기존 필드·정렬·건수는 그대로이고 두 필드만 더해진다. 좋아요를 누르고 다시 목록을 받으면 바로 반영돼 있다.

**DB 시작 상태**: `community` 처음 상태(`bash scripts/java-db.sh --reset`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 박디비(회원 4)는 자유 게시판 글 4·9·12·14에 좋아요를 눌렀고, 이스프링(회원 3)은 글 5에 좋아요, 글 5·9·13(자유 게시판)과 2에 북마크를 해 두었다.

## 지금 코드

- 게시판 목록과 조합 검색은 같은 서비스 메서드에서 같은 항목 DTO로 바뀐다. 고칠 곳이 한 군데로 모이는지 확인한다.
- 좋아요·북마크 저장소에는 "한 글"을 기준으로 한 메서드만 있다. 이번에는 "글 여러 개"를 한 번에 물어야 한다.

## 화면 시나리오

```screen
{
  "title": "자유 게시판 — 카드 아이콘",
  "summary": "목록 한 번으로 카드마다 하트·책갈피를 채운다. 상세를 카드 수만큼 부르지 않는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유 게시판", "right": "이스프링" },
    {
      "type": "list",
      "id": "posts",
      "items": [
        { "id": "p-13", "title": "자유글 02", "meta": "박디비", "badge": "🔖" },
        { "id": "p-12", "title": "자유글 01", "meta": "이스프링" },
        { "id": "p-9", "title": "차단 확인용 글", "meta": "한차단", "badge": "🔖" },
        { "id": "p-5", "title": "스터디원 구해요", "meta": "박디비", "badge": "♥ 🔖" }
      ]
    }
  ],
  "flows": [
    {
      "name": "목록 열기",
      "steps": [
        { "kind": "user", "text": "자유 게시판을 연다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/posts?size=20", "headers": ["Authorization: Bearer tok-lee"] },
        { "kind": "server", "text": "글 목록을 읽은 뒤, 그 글 id 묶음으로 '내 좋아요'·'내 북마크'를 각각 한 번씩만 묻는다" },
        { "kind": "db", "sql": "SELECT post_id FROM post_like WHERE member_id = 3 AND post_id IN (21, 20, …, 4)" },
        { "kind": "db", "sql": "SELECT post_id FROM bookmark WHERE member_id = 3 AND post_id IN (21, 20, …, 4)" },
        { "kind": "response", "status": 200, "body": "{\"items\": [ …, {\"id\": 5, \"title\": \"스터디원 구해요\", …, \"likedByMe\": true, \"bookmarkedByMe\": true}, … ], \"page\": 0, …}" },
        { "kind": "screen", "text": "13·9는 책갈피, 5는 하트와 책갈피가 채워진다", "focus": ["posts", "p-13", "p-9", "p-5"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `GET /api/boards/{slug}/posts`, `GET /api/posts/search` |
| 추가 필드(항목마다) | `likedByMe`(불리언) · `bookmarkedByMe`(불리언). 비로그인은 둘 다 `false` |
| 그대로인 것 | 나머지 필드, 정렬, `page`·`totalElements` 등 페이지 정보 |
| 쿼리 수 | 목록 크기와 무관하게 일정 — 로그인 시 기존보다 최대 2번(좋아요 1·북마크 1) 늘어난다 |

- DB 변화 없음(조회만).

## 직접 확인

```bash
BASE=http://localhost:8080

curl -s "$BASE/api/boards/free/posts?size=20" -H 'Authorization: Bearer tok-park'   # 요청 A — 좋아요 4개
curl -s "$BASE/api/boards/free/posts?size=20" -H 'Authorization: Bearer tok-lee'    # 요청 B — 좋아요 1·북마크 3
curl -s "$BASE/api/boards/free/posts?size=20"                                        # 요청 C — 비로그인
curl -s "$BASE/api/posts/search?tag=spring" -H 'Authorization: Bearer tok-lee'      # 요청 D — 검색도
curl -s -X PUT "$BASE/api/posts/16/like" -H 'Authorization: Bearer tok-park'        # 요청 X1 — 좋아요 누르고
curl -s "$BASE/api/boards/free/posts?size=20" -H 'Authorization: Bearer tok-park'   # 요청 X2 — 바로 반영
curl -s -X DELETE "$BASE/api/posts/16/like" -H 'Authorization: Bearer tok-park'     # 요청 X3 — 되돌리기
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 마지막에 좋아요를 되돌리므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "박디비 — 자유 게시판", "method": "GET", "path": "/api/boards/free/posts?size=20", "headers": { "Authorization": "Bearer tok-park" } },
    { "id": "B", "title": "이스프링 — 자유 게시판", "method": "GET", "path": "/api/boards/free/posts?size=20", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "C", "title": "비로그인", "method": "GET", "path": "/api/boards/free/posts?size=20" },
    { "id": "D", "title": "이스프링 — 검색 tag=spring", "method": "GET", "path": "/api/posts/search?tag=spring", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "X1", "title": "박디비가 글 16 좋아요", "method": "PUT", "path": "/api/posts/16/like", "headers": { "Authorization": "Bearer tok-park" } },
    { "id": "X2", "title": "다시 목록", "method": "GET", "path": "/api/boards/free/posts?size=20", "headers": { "Authorization": "Bearer tok-park" } },
    { "id": "X3", "title": "좋아요 되돌리기", "method": "DELETE", "path": "/api/posts/16/like", "headers": { "Authorization": "Bearer tok-park" } }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[*].id", "equals": [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 9, 5, 4] },
          { "path": "$.items[*].likedByMe", "equals": [false, false, false, false, false, false, false, true, false, true, true, false, true] },
          { "path": "$.items[*].bookmarkedByMe", "equals": [false, false, false, false, false, false, false, false, false, false, false, false, false] }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[*].id", "equals": [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 9, 6, 5, 4] },
          { "path": "$.items[*].likedByMe", "equals": [false, false, false, false, false, false, false, false, false, false, false, false, true, false] },
          { "path": "$.items[*].bookmarkedByMe", "equals": [false, false, false, false, false, false, false, false, true, false, true, false, true, false] }
        ]
      }
    },
    {
      "id": "C3",
      "request": "C",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[*].likedByMe", "notContains": true },
          { "path": "$.items[*].bookmarkedByMe", "notContains": true },
          { "path": "$.items[0].likedByMe", "equals": false },
          { "path": "$.totalElements", "equals": 13 }
        ]
      }
    },
    {
      "id": "C4",
      "request": "D",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[*].id", "equals": [11, 5, 2] },
          { "path": "$.items[*].likedByMe", "equals": [false, true, false] },
          { "path": "$.items[*].bookmarkedByMe", "equals": [false, true, true] }
        ]
      }
    },
    {
      "id": "C5",
      "all": [
        { "request": "X1", "expect": { "status": 200 } },
        { "request": "X2", "expect": { "status": 200, "json": [{ "path": "$.items[5].id", "equals": 16 }, { "path": "$.items[5].likedByMe", "equals": true }] } },
        { "request": "X3", "expect": { "status": 200, "json": [{ "path": "$.liked", "equals": false }] } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 박디비: 14·12·9·4만 `likedByMe: true`, 북마크는 모두 `false` |
| C2 | 요청 B | 이스프링: 5만 좋아요, 13·9·5가 북마크 — 순서·건수는 기존 그대로 |
| C3 | 요청 C | 비로그인: 두 필드가 있고 모두 `false`, 전체 13건 그대로 |
| C4 | 요청 D | 조합 검색에도 같은 두 필드 |
| C5 | 요청 X1~X3 | 좋아요를 누른 직후 목록의 글 16이 `true` — 캐시하지 않고 바로 반영 |
| D1 | `SELECT post_id FROM post_like WHERE member_id = 4 AND post_id IN (SELECT id FROM post WHERE board_id = 4) ORDER BY post_id` | `4 6 8 9 12 14` — 그중 목록에 보이는 `4 9 12 14`만 C1에서 `true`(6 팔로워 공개·8 삭제는 박디비 목록에 없다) |
| D2 | `SELECT post_id FROM bookmark WHERE member_id = 3 AND post_id IN (SELECT id FROM post WHERE board_id = 4) ORDER BY post_id` | `5 8 9 10 13` — 그중 목록에 보이는 `5 9 13`만 C2에서 `true`(8 삭제·10 숨김은 목록에 없다) |
| T1 | (선택) 목록 SQL 수 테스트 | 로그인 상태로 `size=5`와 `size=20`의 SQL 문장 수가 같다(기존 `PostListQueryCountTest`와 같은 방식) |
| R1 | 쿼리 수 | 항목마다 `exists…`를 부르지 않고, 목록의 글 id 묶음으로 `IN` 쿼리 한 번씩(좋아요·북마크) 읽어 `Set`으로 판정한다. 비로그인이면 그 두 쿼리도 보내지 않는다 |
| R2 | 위치 | 게시판 목록·검색이 공유하는 응답 변환 한 곳에서 처리했다(두 API에 같은 코드를 복사하지 않음) |
| R3 | 대안 | 목록 쿼리에 `LEFT JOIN post_like … ON member_id = ?`를 붙이는 방법과 비교해, 페이지 COUNT 쿼리·행 중복·쿼리 재사용 측면에서 왜 "목록 뒤에 IN 한 번"을 골랐는지(또는 반대) 말할 수 있다 |

## 필요한 지식

- [S09 JPA·Hibernate](../docs/knowledge/S09-jpa-hibernate.md) — N+1이 생기는 모양과 묶어서 읽기
- [S10 Spring Data와 쿼리 도구](../docs/knowledge/S10-spring-data-query.md) — `IN` 조건 JPQL, 컬럼 하나만 고르는 쿼리
- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — 응답 DTO에 "보는 사람 기준" 값 넣기
- [V02 계층별 테스트 실습](../docs/knowledge/V02-layered-tests-handson.md) — SQL 수를 테스트로 고정하기(T1)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 저장소</summary>

`@Query("SELECT l.post.id FROM PostLike l WHERE l.member.id = :memberId AND l.post.id IN :postIds") List<Long> findLikedPostIds(...)` — 북마크도 같은 모양. 반환값을 `Set<Long>`으로 바꿔 두고 항목을 만들 때 `contains`로 본다. 목록이 비었으면 `IN ()`을 보내지 않는다.
</details>

<details>
<summary>힌트 2 — 어디서 부르나</summary>

목록·검색 결과(`Page<Post>`)를 응답으로 바꾸는 private 메서드에 보는 사람 id를 넘기고, 거기서 글 id 목록을 뽑아 두 쿼리를 보낸 다음 항목을 만든다. 항목 DTO record에 필드 두 개를 더하면 컴파일 에러가 나는 곳(테스트 포함)을 따라가 맞춘다.
</details>
