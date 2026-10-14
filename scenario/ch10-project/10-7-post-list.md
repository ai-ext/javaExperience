# 10-7. 목록 — 최신·인기·페이지·커서·태그·검색, JPA(JPQL·Pageable)

## 상황

| API | 규칙 | 성공 | 실패 |
|---|---|---|---|
| `GET /api/v1/posts?sort=latest\|popular&page=&size=` · `?cursor=&size=` · `&tag=&q=` | `PUBLIC`만(로그인하면 내 `PRIVATE`도). `size` 1~50, 기본 20. `q`는 제목 검색. 인기순 = 좋아요 수 내림차순 → 같으면 id 내림차순, 최신순 = id 내림차순. 커서는 최신순만 | 200 페이지 또는 커서 | 400(size 범위·잘못된 sort·인기순+커서) |

목록 API는 조건이 많다. 정렬 둘, 페이지 방식 둘, 태그·검색어는 있을 수도 없을 수도 있고, 로그인 여부에 따라 보이는 글도 달라진다. 이 단계는 10-5·10-6과 같은 **JPA**로 만든다. 조건은 JPQL `@Query` 하나에 쓰고, 페이지·정렬은 Spring Data의 `Pageable`에 맡긴다. 같은 목록을 SQL을 직접 쓰는 **MyBatis** 동적 SQL로 짜 보는 것은 맨 아래 [선택 칸](#선택--같은-목록을-mybatis로-짜-보기)이다. 채점(check)은 같아서 어느 쪽으로 짜도 통과한다.

명세서가 정한 응답은 두 모양이다.

```json
{ "items": [ … ], "page": 0, "size": 20, "totalElements": 57, "hasNext": true }
{ "items": [ … ], "nextCursor": "17" }
```

**페이지와 커서는 무엇이 다른가.** 페이지 방식(`page=3`)은 "앞에서 60개 건너뛰고 20개"다. 그 사이 새 글이 생기면 경계가 밀려 같은 글을 두 번 보거나 하나를 놓친다. 커서 방식은 "마지막으로 본 글(id 17)보다 오래된 것부터 20개"라 새 글이 생겨도 밀리지 않는다. 무한 스크롤에 쓴다. 그런데 **인기순에서는 커서가 깨진다.** 좋아요 수가 바뀌면 순서 자체가 바뀌어서 "이 글 다음"이 의미를 잃는다. 그래서 명세서는 인기순 + 커서를 400으로 막았다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 목록 화면",
  "summary": "정렬 탭, 태그 칩, 검색창이 있는 목록. 데스크톱은 페이지 번호, 모바일은 무한 스크롤(커서).",
  "screen": [
    { "type": "bar", "id": "bar", "label": "게시판", "right": "비로그인" },
    { "type": "chips", "id": "sort", "label": "정렬", "items": ["최신순", "인기순"] },
    { "type": "chips", "id": "tag", "label": "태그", "items": ["mybatis"] },
    { "type": "field", "id": "q", "label": "제목 검색", "value": "" },
    { "type": "list", "id": "items", "items": [
      { "title": "페이지와 커서 페이징", "meta": "박디비 · 좋아요 1", "badge": "#21" },
      { "title": "resultMap 써 보기", "meta": "이스프링 · 좋아요 2", "badge": "#17" }
    ], "footer": "1 / 2 페이지 · 전체 4개" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "next", "label": "다음 페이지", "variant": "secondary" }, { "id": "more", "label": "더 보기(무한 스크롤)", "variant": "ghost" }] }
  ],
  "flows": [
    {
      "name": "태그로 거르고 페이지 넘기기",
      "steps": [
        { "kind": "user", "text": "태그 mybatis를 누른다(한 페이지 2개)", "focus": ["tag"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/posts?tag=mybatis&size=2" },
        { "kind": "db", "sql": "select p1_0.id, p1_0.title, ..., a1_0.nickname\nfrom posts p1_0 join users a1_0 on a1_0.id = p1_0.author_id\nwhere p1_0.deleted_at is null\n  and (p1_0.visibility = 'PUBLIC' or p1_0.author_id = ?)\n  and (? is null or exists(select 1 from posts p2_0 join post_tags t1_0 ... where p2_0.id = p1_0.id and t1_1.name = ?))\n  and (? is null or p1_0.title like concat('%', ?, '%') escape '')\norder by p1_0.id desc\nlimit ?;\n-- + 같은 조건으로 select count(*), + 이 페이지 글들의 태그를 in 한 번", "note": "Hibernate가 만든 SQL(로그 그대로, 컬럼 생략). 값이 없는 조건은 ? is null이 참이 되어 걸러지지 않는다" },
        { "kind": "response", "status": 200, "body": "{\n  \"status\": 200,\n  \"data\": {\n    \"items\": [ { \"id\": 21, ... }, { \"id\": 17, ... } ],\n    \"page\": 0, \"size\": 2, \"totalElements\": 4, \"hasNext\": true\n  }\n}" },
        { "kind": "screen", "text": "1/2 페이지, [다음 페이지] 활성", "focus": ["items", "next"] }
      ]
    },
    {
      "name": "무한 스크롤(커서)",
      "steps": [
        { "kind": "user", "text": "모바일에서 끝까지 내린다", "focus": ["more"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/posts?tag=mybatis&size=2&cursor=17" },
        { "kind": "db", "sql": "... and (? is null or p1_0.id < ?) order by p1_0.id desc limit ?;   -- 17, 17, 3", "note": "Slice가 하나 더(3개) 읽어 보고 남으면 다음이 있다고 본다" },
        { "kind": "response", "status": 200, "body": "{\n  \"status\": 200,\n  \"data\": { \"items\": [ { \"id\": 11, ... }, { \"id\": 5, ... } ], \"nextCursor\": null }\n}" },
        { "kind": "screen", "text": "nextCursor가 null — 더 불러올 것이 없다", "focus": ["items"] }
      ]
    },
    {
      "name": "인기순 + 커서",
      "steps": [
        { "kind": "user", "text": "(프론트 실수) 인기순 탭에서 무한 스크롤", "focus": ["sort", "more"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/posts?sort=popular&cursor=" },
        { "kind": "server", "text": "좋아요가 바뀌면 순서가 흔들려 커서가 중복·누락을 낸다 → 거절" },
        { "kind": "response", "status": 400, "body": "{\n  \"status\": 400,\n  \"code\": \"VALIDATION_FAILED\",\n  \"errors\": [ { \"field\": \"cursor\", \"reason\": \"커서 페이징은 최신순(latest)에서만 쓸 수 있습니다.\" } ],\n  \"data\": null\n}" },
        { "kind": "screen", "text": "인기순은 페이지 번호로만", "focus": ["sort"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/v1/posts`, 로그인 선택 |
| 쿼리 | `sort`(`latest`·`popular`, 기본 `latest`), `page`(0 이상, 기본 0), `size`(1~50, 기본 20), `cursor`, `tag`, `q` |
| 방식 고르기 | `cursor` 파라미터가 **있으면**(빈 값이면 처음부터) 커서 방식, 없으면 페이지 방식 |
| 보이는 글 | `deleted_at IS NULL` 이고 (`PUBLIC` 또는 로그인한 사람의 글) |
| `tag` | 공백 제거·소문자로 다듬어 그 태그가 달린 글만 |
| `q` | 제목에 포함(`LIKE '%q%'`). 비어 있으면 조건 없음 |
| 정렬 | 최신순 `id DESC`, 인기순 `like_count DESC, id DESC` |
| 페이지 응답 | `{items, page, size, totalElements, hasNext}` — `totalElements`는 같은 조건의 전체 개수 |
| 커서 응답 | `{items, nextCursor}` — `nextCursor`는 마지막 글의 id(문자열), 더 없으면 `null` |
| 항목 | `{id, title, visibility, viewCount, likeCount, author{id, nickname}, tags(이름순), createdAt}` |
| 400 | `size` 범위 밖·숫자 아님, `sort`가 두 값 밖, `page` 음수, 인기순 + `cursor`, `page`와 `cursor`를 함께, 숫자가 아닌 `cursor` — 모두 `VALIDATION_FAILED`, `errors[].field`가 그 파라미터 이름 |
| 구현 | JPA — 목록 전용 리포지토리의 JPQL `@Query` + `Pageable`(페이지·정렬). 페이지는 `Page`, 커서는 `Slice` |

명세서에 없던 것을 정했다. 커서 값은 마지막 글의 id를 문자열로 준다. 클라이언트는 받은 값을 **그대로 돌려보내기만** 한다(안을 해석하지 않는다). `page`와 `cursor`를 함께 보내면 400이다.

## 설계 포인트

- **정렬은 사용자가 보낸 문자열로 만들지 않는다.** `Sort.by(query.sort())`는 아무 속성 이름이나 받는다 — 엔티티 필드 이름이 그대로 바깥 입력이 되고, 없는 이름이면 Spring Data가 `PropertyReferenceException`을 던진다. JPQL에 `"order by " + sort`로 이어 붙이면 SQL 주입과 같은 문제가 된다(JPQL 주입). **정해 둔 `Sort` 둘 중에서 고른다**: 최신순 `Sort.by(desc("id"))`, 인기순 `Sort.by(desc("likeCount"), desc("id"))`. 값은 항상 `:tag`처럼 바인딩으로 넣는다.
- **있을 수도 없을 수도 있는 조건은 `(:tag is null or ...)`로.** JPQL은 문자열 하나라 조건을 붙였다 뗐다 할 수 없다. 값이 `null`이면 앞쪽이 참이 되어 그 조건이 빠진 것과 같다. 조건이 더 늘어나 이 모양이 버거워지면 Specification·Querydsl을 쓰거나, SQL을 직접 쓰는 MyBatis로 간다(아래 선택 칸).
- **같은 조건을 두 번 쓰지 않는다.** 반환 타입이 `Page`면 Spring Data가 같은 JPQL에서 `select count(*)` 쿼리를 만들어 `totalElements`를 채운다. 커서 쿼리는 조건 문자열 상수(`VISIBLE`) 뒤에 `and (:cursorId is null or p.id < :cursorId)`만 이어 붙인다. 실측: 첫 페이지 결과가 `size`보다 적으면 개수가 이미 확정이라 count 쿼리를 생략한다.
- **"다음이 있나"는 하나 더 읽어서.** 커서는 반환 타입을 `Slice`로 하고 `PageRequest.of(0, size, 최신순)`을 넘긴다. Spring Data가 `size + 1`개를 읽어 남으면 `hasNext()`가 참이다. 개수 쿼리는 없다. 어디서부터인지는 페이지 번호가 아니라 `id < :cursorId`가 정한다(keyset).
- **작성자는 같은 쿼리에서, 태그는 따로 한 번에.** `@EntityGraph(attributePaths = "author")`로 작성자를 JOIN해 함께 읽는다(글마다 작성자를 따로 읽으면 N+1). 태그는 컬렉션이라 `join fetch p.tags`와 페이징을 같이 쓰면 행이 태그 수만큼 불어나 `LIMIT`가 글 단위로 걸리지 않는다. 목록은 글만 페이징하고, 그 페이지 글 id들의 태그를 `where p.id in :postIds` 한 번으로 읽어 자바에서 붙인다.
- **Spring의 `Page`를 그대로 응답하지 않는다.** `Page`를 JSON으로 내보내면 `content`·`pageable`·`totalPages`… 명세에 없는 모양이 나가고 Spring 버전에 따라 바뀐다. 명세의 `{items, page, size, totalElements, hasNext}` record로 옮긴다.
- **쿼리 파라미터 묶음은 record 하나로.** `@Valid @ModelAttribute PostListQuery query`로 받으면 `@Min`·`@Max`·`@Pattern`이 그대로 동작하고, 실패는 `@RequestBody`와 같은 `MethodArgumentNotValidException`으로 온다(10-2 처리기가 그대로 받는다). `size=abc`처럼 **변환** 실패도 같은 예외로 오는데, 기본 문구가 영어 내부 메시지라 `fieldError.isBindingFailure()`면 "형식이 올바르지 않습니다."로 바꾼다.
- **두 값을 함께 봐야 하는 규칙**(인기순 + 커서)은 애노테이션으로 걸기 어렵다. 서비스에서 확인하고, 필드 오류를 담은 400 예외를 던진다(`ApiException`에 `errors`를 실을 수 있게 넓힌다).

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- Hibernate가 만든 SQL(로그 그대로, 컬럼 생략). 값이 없는 조건은 ? is null이 참이 되어 걸러지지 않는다
- Slice가 하나 더(3개) 읽어 보고 남으면 다음이 있다고 본다
- 좋아요가 바뀌면 순서가 흔들려 커서가 중복·누락을 낸다 → 거절

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/v1/posts")`. 변경된 메서드: `list`.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`CursorResponse.java`, `PageResponse.java`, `PostListItemResponse.java`, `PostTagRow.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostQueryService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `list`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostQueryRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiException.java`, `GlobalExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `invalid`, `errors`.

</details>

<details>
<summary>설정·보조 코드</summary>

`PostListQuery.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `cursorMode`.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
KIM=$(curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"kim@example.com","password":"password1234"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
get() { curl -s -G "$BASE/api/v1/posts" "$@"; echo; echo ----; }

get -d tag=mybatis -d size=2                       # A 태그 + 페이지 0
get -d tag=mybatis -d size=2 -d page=1             # B 페이지 1
get -d sort=popular -d size=3                      # C 인기순
get -d tag=mybatis -d size=2 --data-urlencode cursor=   # D 커서 처음
get -d tag=mybatis -d size=2 -d cursor=17          # E 커서 다음(D의 nextCursor)
get --data-urlencode q=트랜잭션                     # F 제목 검색
get --data-urlencode tag=회고                       # G 비로그인
get --data-urlencode tag=회고 -H "Authorization: Bearer $KIM"   # H 김자바 — 내 비공개 글 포함
get -d sort=popular --data-urlencode cursor=       # I 인기순 + 커서
get -d size=51                                     # J size 범위
get -d sort=oldest                                 # K 잘못된 sort
get -d size=abc                                    # Z 숫자 아님
get -d size=5                                      # N 최신순 기본
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 시드 데이터(태그 `mybatis`·`회고`, 제목 "트랜잭션", 좋아요 3개짜리 글)에 기대므로, 다른 단계의 채점이 만든 글(`[채점]`)이 섞여도 결과가 같다. 시드 글에 직접 좋아요를 누르거나 태그를 붙였다면 `docker compose down -v && docker compose up -d`으로 되돌린다.

```check
{
  "requests": [
    { "id": "A", "title": "태그 + 페이지 0", "method": "GET", "path": "/api/v1/posts?tag=mybatis&size=2" },
    { "id": "B", "title": "페이지 1", "method": "GET", "path": "/api/v1/posts?tag=mybatis&size=2&page=1" },
    { "id": "C", "title": "인기순", "method": "GET", "path": "/api/v1/posts?sort=popular&size=3" },
    { "id": "D", "title": "커서 처음", "method": "GET", "path": "/api/v1/posts?tag=mybatis&size=2&cursor=" },
    { "id": "E", "title": "커서 다음", "method": "GET", "path": "/api/v1/posts?tag=mybatis&size=2&cursor={{D.body.data.nextCursor}}" },
    { "id": "F", "title": "제목 검색", "method": "GET", "path": "/api/v1/posts?q=%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98" },
    { "id": "L", "title": "로그인(김자바)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "password1234" } },
    { "id": "G", "title": "태그 회고 — 비로그인", "method": "GET", "path": "/api/v1/posts?tag=%ED%9A%8C%EA%B3%A0" },
    { "id": "H", "title": "태그 회고 — 김자바", "method": "GET", "path": "/api/v1/posts?tag=%ED%9A%8C%EA%B3%A0", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "I", "title": "인기순 + 커서", "method": "GET", "path": "/api/v1/posts?sort=popular&cursor=" },
    { "id": "J", "title": "size 51", "method": "GET", "path": "/api/v1/posts?size=51" },
    { "id": "K", "title": "잘못된 sort", "method": "GET", "path": "/api/v1/posts?sort=oldest" },
    { "id": "Z", "title": "size 숫자 아님", "method": "GET", "path": "/api/v1/posts?size=abc" },
    { "id": "N", "title": "최신순 기본", "method": "GET", "path": "/api/v1/posts?size=5" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.data.items[*].id", "equals": [21, 17] },
          { "path": "$.data.page", "equals": 0 },
          { "path": "$.data.size", "equals": 2 },
          { "path": "$.data.totalElements", "equals": 4 },
          { "path": "$.data.hasNext", "equals": true },
          { "path": "$.data.items[0].author", "equals": { "id": 3, "nickname": "박디비" } },
          { "path": "$.data.items[0].tags", "equals": ["mybatis", "mysql"] },
          { "path": "$.data.items[0].likeCount", "type": "number" },
          { "path": "$.data.items[0].createdAt", "matches": "^2026-09-21T09:00:00" }
        ]
      }
    },
    { "id": "C2", "request": "B", "expect": { "status": 200, "json": [{ "path": "$.data.items[*].id", "equals": [11, 5] }, { "path": "$.data.page", "equals": 1 }, { "path": "$.data.hasNext", "equals": false }] } },
    {
      "id": "C3",
      "request": "C",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.data.items[*].id", "equals": [11, 6, 2] },
          { "path": "$.data.items[*].likeCount", "equals": [3, 3, 3] }
        ]
      },
      "note": "좋아요 수가 같으면 id가 큰 글이 먼저"
    },
    {
      "id": "C4",
      "all": [
        { "request": "D", "expect": { "status": 200, "json": [{ "path": "$.data.items[*].id", "equals": [21, 17] }, { "path": "$.data.nextCursor", "type": "string" }, { "path": "$.data.page", "exists": false }] } },
        { "request": "E", "expect": { "status": 200, "json": [{ "path": "$.data.items[*].id", "equals": [11, 5] }, { "path": "$.data.nextCursor", "type": "null" }] } }
      ]
    },
    { "id": "C5", "request": "F", "expect": { "status": 200, "json": [{ "path": "$.data.items[*].id", "equals": [20, 6] }, { "path": "$.data.totalElements", "equals": 2 }] } },
    {
      "id": "C6",
      "all": [
        { "request": "G", "expect": { "status": 200, "json": [{ "path": "$.data.items[*].id", "equals": [22, 18, 12] }] } },
        { "request": "H", "expect": { "status": 200, "json": [{ "path": "$.data.items[*].id", "equals": [24, 22, 18, 12] }, { "path": "$.data.items[0].visibility", "equals": "PRIVATE" }] } }
      ],
      "note": "삭제된 25는 누구에게도, 비공개 24는 작성자에게만"
    },
    { "id": "C7", "request": "I", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "VALIDATION_FAILED" }, { "path": "$.errors[*].field", "contains": "cursor" }] } },
    {
      "id": "C8",
      "all": [
        { "request": "J", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "size" }] } },
        { "request": "K", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "sort" }] } },
        { "request": "Z", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "VALIDATION_FAILED" }, { "path": "$.errors[*].field", "contains": "size" }] } }
      ]
    },
    {
      "id": "C9",
      "request": "N",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.data.items", "length": 5 },
          { "path": "$.data.size", "equals": 5 },
          { "path": "$.data.items[0].id", "gt": "{{N.body.data.items[1].id}}" },
          { "path": "$.data.items[1].id", "gt": "{{N.body.data.items[2].id}}" },
          { "path": "$.data.items[*].id", "notContains": 25 }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | `200`, `items` id `[21, 17]`, `page`=`0`, `size`=`2`, `totalElements`=`4`, `hasNext`=`true`. 21의 `author`=`{id: 3, nickname: 박디비}`, `tags`=`["mybatis","mysql"]`, `createdAt`=`2026-09-21T09:00:00` |
| C2 | 요청 B | `items` id `[11, 5]`, `page`=`1`, `hasNext`=`false` |
| C3 | 요청 C | 인기순 앞 셋이 `[11, 6, 2]`(모두 좋아요 3 — 같으면 id 내림차순) |
| C4 | 요청 D·E | 커서 처음 `[21, 17]` + `nextCursor` 문자열(페이지 필드 없음), 그 커서로 다음 `[11, 5]` + `nextCursor`=`null` |
| C5 | 요청 F | 제목 "트랜잭션" → `[20, 6]`, `totalElements`=`2` |
| C6 | 요청 G·H | 태그 `회고`: 비로그인 `[22, 18, 12]`, 김자바 `[24, 22, 18, 12]`(맨 앞이 자기 비공개 글) |
| C7 | 요청 I | `400 VALIDATION_FAILED`, `field`에 `cursor` |
| C8 | 요청 J·K·Z | 모두 `400`, `field`에 각각 `size`·`sort`·`size` |
| C9 | 요청 N | `items` 5개, id 내림차순, 삭제된 25 없음 |
| R1 | 정렬 | 사용자가 보낸 `sort` 문자열을 `Sort.by(...)`나 JPQL에 그대로 넣지 않고 정해 둔 `Sort` 중에서 고른다. 값은 모두 바인딩(`:name`). MyBatis로 짰다면 `${}` 없이 `<choose>`, 값은 `#{}` |
| R2 | 조건 재사용 | 목록·개수·커서가 같은 조건을 쓴다(`Page`의 자동 count, 조건 상수 공유 / MyBatis는 `<sql>`+`<include>`) |
| R3 | 태그 | 태그를 JOIN한 채 페이징하지 않는다. 페이지의 글 id로 태그를 한 번에(`IN`) 읽는다. 작성자는 N+1 없이 함께 |
| R4 | 계층 | 목록 전용 리포지토리·서비스(예: `PostQueryRepository`·`PostQueryService`)를 쓰기와 나눠 둔다. Spring의 `Page`를 그대로 응답하지 않는다 |

## 필요한 지식

- [G1 페이징과 정렬](../../lessons/G1-paging-and-sorting.md) — `Pageable`·`PageRequest`·`Sort`
- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md) — 리포지토리·JPQL
- [E2 DB와 SQL 기초](../../lessons/E2-db-sql-basics.md) — `JOIN`·`EXISTS`·`LIKE`·`LIMIT`
- [S10 Spring Data 쿼리](../../docs/knowledge/S10-spring-data-query.md) — `@Query`·`Page`와 `Slice`
- [W15 페이지(offset)와 커서](../../docs/knowledge/W15-paging-offset-vs-cursor.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 목록 전용 리포지토리와 JPQL</summary>

쓰기용 `PostRepository`와 나눠 읽기 전용 인터페이스를 하나 둔다. `Repository<Post, Long>`을 상속하면 `save`·`delete` 같은 쓰기 메서드가 딸려 오지 않는다. 조건은 문자열 상수 하나로 두고 두 쿼리가 이어 붙여 쓴다.

```java
public interface PostQueryRepository extends Repository<Post, Long> {

    String VISIBLE = """
            p.deletedAt is null
            and (p.visibility = org.example.board.post.Visibility.PUBLIC or p.author.id = :loginUserId)
            and (:tag is null or exists (select 1 from Post p2 join p2.tags t where p2.id = p.id and t.name = :tag))
            and (:q is null or p.title like concat('%', :q, '%'))
            """;

    @EntityGraph(attributePaths = "author")
    @Query("select p from Post p where " + VISIBLE)
    Page<Post> findVisible(Long loginUserId, String tag, String q, Pageable pageable);
}
```

JPQL은 테이블·컬럼이 아니라 **엔티티·필드 이름**(`Post`, `p.deletedAt`)으로 쓴다. 비로그인이면 `loginUserId`가 `null`이라 `p.author.id = null`은 참이 아니고, 공개 글만 남는다.
</details>

<details>
<summary>힌트 2 — 페이지: Pageable과 Sort</summary>

```java
Sort sort = "popular".equals(query.sort())
        ? Sort.by(Sort.Order.desc("likeCount"), Sort.Order.desc("id"))
        : Sort.by(Sort.Order.desc("id"));
Page<Post> result = postQueryRepository.findVisible(userId, query.tag(), query.q(),
        PageRequest.of(page, query.size(), sort));
// result.getContent() · result.getTotalElements() · result.hasNext() → 명세의 응답 record로
```

`Sort`에 넣는 이름도 엔티티 필드 이름(`likeCount`)이다. JPQL에 `order by`를 직접 쓰지 않아도 Spring Data가 `Pageable`의 정렬을 붙인다.
</details>

<details>
<summary>힌트 3 — 커서: Slice와 id &lt; :cursorId</summary>

```java
@EntityGraph(attributePaths = "author")
@Query("select p from Post p where " + VISIBLE + " and (:cursorId is null or p.id < :cursorId)")
Slice<Post> findVisibleBefore(Long loginUserId, String tag, String q, Long cursorId, Pageable pageable);
```

커서 처음(`cursor=` 빈 값)은 `cursorId`를 `null`로 넘긴다. 항상 `PageRequest.of(0, size, 최신순)` — 몇 번째 페이지인지는 커서가 정하므로 페이지 번호는 늘 0이다. `slice.hasNext()`가 참이면 마지막 글의 id를 문자열로 `nextCursor`에 담는다.
</details>

<details>
<summary>힌트 4 — 태그를 IN 한 번으로</summary>

```java
@Query("select new org.example.board.post.PostTagRow(p.id, t.name) from Post p join p.tags t where p.id in :postIds order by t.name")
List<PostTagRow> findTagsByPostIds(List<Long> postIds);
```

`PostTagRow`는 `record PostTagRow(Long postId, String name)`. `select new`는 결과를 엔티티가 아닌 record로 바로 받는다(전체 이름을 쓴다). `Collectors.groupingBy(PostTagRow::postId, mapping(PostTagRow::name, toList()))`로 글 id별로 묶는다. 페이지가 비었으면 이 쿼리를 부르지 않는다(`in ()`).
</details>

<details>
<summary>힌트 5 — 컨트롤러 반환 타입</summary>

페이지와 커서의 `data` 모양이 달라서 서비스가 `Object`(또는 두 record의 공통 인터페이스)를 돌려주게 한다. 실무에서는 두 API로 나누기도 한다(`/posts`와 `/posts/feed`). 이 명세서는 한 주소로 정했다.
</details>

## 선택 — 같은 목록을 MyBatis로 짜 보기

JPA로 끝냈다면 여기는 건너뛰어도 된다. 조건이 많은 조회를 SQL로 직접 쓰는 방식을 익히고 싶을 때, 같은 API를 **MyBatis 동적 SQL**로 다시 짠다. 아래 **MyBatis 대체 구현 코드** 접기에 Mapper·XML·Service·DTO·설정의 파일 전문이 있다. 격리된 `project` DB에서 이 대체 구현을 컴파일하고 위 실행 칸 C1~C9를 모두 통과시켰다. 먼저 [E5 MyBatis 첫걸음](../../lessons/E5-mybatis-first-steps.md)을 읽고, XML 문법은 [W04 MyBatis XML 실무](../../docs/knowledge/W04-mybatis-xml-practical.md), 둘을 어떻게 나눠 쓰는지는 [W05](../../docs/knowledge/W05-jpa-vs-mybatis-strategy.md)를 본다.

**의존성 추가** — MyBatis는 이때 처음 넣는다(10-12를 할 때도 같다). Boot BOM에 없어서 버전을 직접 적는다(4.1.x가 Boot 4.1용).

```groovy
implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'
```

```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true   # 컬럼 view_count → 필드 viewCount
```

**동적 SQL 요점**

- 값이 있을 때만 조건을 붙인다: `<if test="cond.tag != null">AND EXISTS (...)</if>`. JPQL의 `? is null or`와 달리 **값이 없으면 SQL에서 그 줄이 아예 빠진다.** `<where>`가 맨 앞 `AND`를 정리한다.
- 정렬은 `ORDER BY ${sort}`로 끼우지 않는다(쿼리 파라미터가 SQL에 그대로 붙어 SQL 주입). `<choose><when test="cond.sort == 'popular'">ORDER BY p.like_count DESC, p.id DESC</when><otherwise>ORDER BY p.id DESC</otherwise></choose>`로 정해 둔 조각에서 고른다. 값은 항상 `#{}`.
- 목록과 `COUNT(*)`의 WHERE가 같아야 `totalElements`가 맞는다. `<sql id="visibleWhere">`로 한 번 쓰고 `<include refid="visibleWhere"/>`로 두 곳에서 쓴다. 개수 쿼리는 Spring Data처럼 알아서 만들어 주지 않는다.
- 커서는 `LIMIT #{limit}`에 `size + 1`을 넘겨 남으면 다음이 있다고 본다. XML 안에서 `<`는 `&lt;`로 쓴다(`p.id &lt; #{cursorId}`).
- 태그는 `<foreach collection="postIds" item="id" open="(" separator="," close=")">#{id}</foreach>`로 `IN` 한 번.

**바뀌는 파일**(정답 기준, JPA판 → MyBatis판)

| 파일 | 바뀌는 것 |
|---|---|
| `build.gradle` · `application.yml` | starter 한 줄 · `mybatis:` 설정 |
| `post/PostQueryMapper.java`(새로) | `@Mapper` 인터페이스 — `findPage`·`count`·`findAfterCursor`·`findTagsByPostIds` |
| `resources/mapper/PostQueryMapper.xml`(새로) | 위 네 쿼리 + `<sql>` 조각(`columns`·`visibleWhere`) |
| `post/PostListRow.java`(새로) | SQL 결과 한 줄을 담는 클래스(`author_id`·`author_nickname`이 평평하게) |
| `post/PostQueryService.java` | 리포지토리 대신 매퍼를 부른다. 개수 쿼리·`size + 1`을 직접 |
| `post/PostListItemResponse.java` | `of(Post, …)` 대신 `of(PostListRow, …)` — `author{id, nickname}`으로 묶기 |
| `post/PostQueryRepository.java` | 지운다(목록은 매퍼가) |

<details>
<summary>MyBatis판 WHERE 조각</summary>

```xml
<sql id="visibleWhere">
    p.deleted_at IS NULL
    AND (p.visibility = 'PUBLIC'
    <if test="loginUserId != null">OR p.author_id = #{loginUserId}</if>)
    <if test="cond.tag != null">
        AND EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
                    WHERE pt.post_id = p.id AND t.name = #{cond.tag})
    </if>
    <if test="cond.q != null">AND p.title LIKE CONCAT('%', #{cond.q}, '%')</if>
</sql>
```

매개변수가 둘 이상이면 `@Param("cond") PostListQuery cond`처럼 이름을 붙이고, XML에서 `#{cond.tag}`로 쓴다. XML의 `namespace`는 매퍼 인터페이스의 전체 이름(`org.example.board.post.PostQueryMapper`), `<select id>`는 메서드 이름이다. `PostListRow`는 setter가 없어도 MyBatis가 필드에 값을 넣는다.
</details>

## 다음 단계

[10-8. 수정과 삭제](10-8-update-delete.md) — 작성자만 고치고 지운다. 남이면 403. 삭제는 행을 지우지 않는다.
