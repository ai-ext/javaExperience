# 11-4. 통합 검색 — 제목·본문·작성자

> 시나리오 DB(`community`). 스키마 변경 없음.

## 상황

> "상단 검색창에 '트랜잭션 정리'라고 치면 제목이든 본문이든 그 말이 들어간 글이 나와야 해요. 작성자 이름으로도 찾고 싶고요. 지금 검색은 필터 화면용이라 제목만 보잖아요."

8-4의 `GET /api/posts/search`는 **필터 화면**용이다 — 게시판·태그·작성자 id·기간을 골라 거르고, `q`는 제목만 본다. 사용자가 상단 검색창에 치는 말은 다르다.

- 띄어 쓴 단어가 여러 개면 **모두 들어 있는 글**만(AND) — "트랜잭션 정리"는 두 단어가 다 있어야 한다.
- 단어는 **제목·본문·작성자 닉네임 중 어디에 있어도** 된다. 범위를 좁히는 옵션(`in`)도 둔다.
- 사용자가 친 `%`, `_`는 **그냥 글자**다. SQL `LIKE`에서는 와일드카드라서 그대로 넣으면 `100%`를 찾았는데 엉뚱한 글이 다 나온다.
- 2-3의 "볼 수 있는 글만" 규칙은 그대로 붙는다.

새 API로 만들되, 쿼리는 8-4에서 만든 조립기(조건만 붙이는 동적 쿼리)를 그대로 쓴다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "상단 검색창",
  "summary": "띄어 쓴 단어가 모두 들어 있는 글을 제목·본문·작성자에서 찾는다. 볼 수 있는 글만.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "검색", "right": "김자바" },
    { "type": "field", "id": "q", "label": "검색어", "value": "트랜잭션 정리" },
    { "type": "select", "id": "scope", "label": "범위", "value": "전체(제목·본문·작성자)" },
    { "type": "actions", "id": "search-actions", "items": [{ "id": "search", "label": "검색", "variant": "primary" }] },
    {
      "type": "list",
      "id": "results",
      "label": "검색 결과",
      "items": [{ "id": "hit-48", "title": "[채점] 트랜잭션 정리", "meta": "김자바 · 제목에 두 단어" }],
      "footer": "1건"
    },
    { "type": "toast", "id": "too-short", "value": "검색어를 2자 이상 입력해 주세요", "tone": "warning" }
  ],
  "flows": [
    {
      "name": "두 단어 검색",
      "steps": [
        { "kind": "user", "text": "'트랜잭션 정리'를 치고 [검색]", "focus": ["q", "search"] },
        { "kind": "request", "method": "GET", "path": "/api/search/posts?q=트랜잭션%20정리&in=all&page=0&size=10", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "검색어 정리(앞뒤 공백·겹친 공백) → 단어 ['트랜잭션', '정리'] → 단어마다 (제목 OR 본문 OR 닉네임) LIKE, 단어끼리는 AND + 볼 수 있는 글 규칙" },
        { "kind": "db", "sql": "SELECT p.* FROM post p JOIN member a ON a.id = p.author_id\nWHERE p.deleted_at IS NULL AND p.status = 'PUBLISHED' AND (…볼 수 있는 글…)\n  AND (LOWER(p.title) LIKE '%트랜잭션%' ESCAPE '\\\\' OR LOWER(p.content) LIKE '%트랜잭션%' ESCAPE '\\\\' OR LOWER(a.nickname) LIKE '%트랜잭션%' ESCAPE '\\\\')\n  AND (LOWER(p.title) LIKE '%정리%' ESCAPE '\\\\' OR …)\nORDER BY p.published_at DESC, p.id DESC LIMIT 10" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 48, \"title\": \"[채점] 트랜잭션 정리\", ...}], \"totalElements\": 1, \"hasNext\": false, ...}" },
        { "kind": "screen", "text": "결과 1건", "focus": ["results"] }
      ]
    },
    {
      "name": "한 글자 검색",
      "steps": [
        { "kind": "user", "text": "'자'만 치고 [검색]", "focus": ["q", "search"] },
        { "kind": "request", "method": "GET", "path": "/api/search/posts?q=자" },
        { "kind": "server", "text": "2자 미만 — 거의 모든 글이 걸리는 검색은 받지 않는다" },
        { "kind": "response", "status": 400, "body": "{\"status\": 400, \"errors\": [{\"field\": \"q\", \"message\": \"검색어는 앞뒤 공백을 빼고 2~50자여야 합니다.\"}]}" },
        { "kind": "screen", "text": "'검색어를 2자 이상 입력해 주세요'", "focus": ["too-short"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/search/posts?q=&in=all&page=0&size=10` |
| 인증 | 선택(2-3과 같다 — 없으면 비로그인, 있으면 그 회원 기준으로 볼 수 있는 글) |
| 찾는 방법 | `q`를 정리해 공백으로 나눈 **단어마다** `in` 범위의 칸 중 하나에 들어 있어야 한다(단어끼리 AND, 칸끼리 OR). 부분 일치, 대소문자 무시 |
| `%`·`_`·`\` | 와일드카드가 아니라 글자 그대로 찾는다 |
| 정렬·응답 | 2-2 게시판 목록과 같다(`published_at` 최신 → `id`, `items`·`totalElements`·`hasNext` …) |
| 볼 수 있는 글 | 2-3 목록 규칙 그대로(임시저장·숨김·삭제·남의 팔로워 공개·차단 제외) |

**파라미터 규칙** — 틀린 파라미터는 **모두** 모아 `400` + `errors: [{field, message}]`. 어떤 값에도 `500`이 나오면 안 된다.

| 파라미터 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `q` | 예 | 없음·빈 값·공백만 안 됨 | 앞뒤 공백을 지우고 겹친 공백을 하나로 만든 뒤 **2~50자**, 단어 **5개까지** | 문자열 | — | 400(`q`) |
| `in` | 아니오 | 생략 가능 | — | `all`·`title`·`content`·`author`(`author`=작성자 닉네임) | `all` | 400(`in`) |
| `page` | 아니오 | 생략 가능 | 0 이상 | 정수 | `0` | 400(`page`), 숫자가 아니면 400 |
| `size` | 아니오 | 생략 가능 | 1~50 | 정수 | `10` | 400(`size`), 숫자가 아니면 400 |

- 8-4의 `GET /api/posts/search`는 바꾸지 않는다.
- 스키마 변경 없음. `LIKE '%단어%'`는 인덱스를 못 탄다 — 글이 많아지면 무엇으로 바꿀지는 R4에서 말한다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 검색어 정리(앞뒤 공백·겹친 공백) → 단어 ['트랜잭션', '정리'] → 단어마다 (제목 OR 본문 OR 닉네임) LIKE, 단어끼리는 AND + 볼 수 있는 글 규칙
- 2자 미만 — 거의 모든 글이 걸리는 검색은 받지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`KeywordSearchController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/search/posts")`. 변경된 메서드: `search`.

```java
@GetMapping("/api/search/posts")
public PostListResponse search(@RequestParam(required = false) String q,
                               @RequestParam(required = false) String in,
                               @RequestParam(required = false) String page,
                               @RequestParam(required = false) String size,
                               @LoginMember AuthenticatedMember viewer) {
    return postQueryService.keywordSearch(KeywordSearchRequest.of(q, in, page, size), viewer);
}
```

숫자 파라미터도 우선 문자열로 받아 DTO에서 검사한다. Spring이 먼저 숫자 변환에 실패하면 다른 필드의 오류를 함께 모을 수 없다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`KeywordSearchRequest.java`, `PostSearchCondition.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다. 변경된 메서드: `of`, `ofKeywords`.

```java
String normalized = q == null ? "" : q.strip().replaceAll("\\s+", " ");
List<String> words = normalized.isEmpty() ? List.of() : List.of(normalized.split(" "));
int p = parseInteger(page, "page", 0, 0, Integer.MAX_VALUE, errors);
int s = parseInteger(size, "size", 10, 1, 50, errors);
if (!errors.isEmpty()) throw new InvalidParametersException(errors);
return new KeywordSearchRequest(new ArrayList<>(words), scope, p, s);
```

`q`와 `in`도 같은 `errors`에 담는다. X11처럼 네 필드가 모두 틀리면 네 항목을 한 번에 돌려준다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostQueryService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `keywordSearch`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional(readOnly = true)
public PostListResponse keywordSearch(KeywordSearchRequest request, AuthenticatedMember viewer) {
    return toListResponse(postSearchRepository.search(
            PostSearchCondition.ofKeywords(request.words(), request.scope()),
            viewerIdOf(viewer), PageRequest.of(request.page(), request.size())));
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostSearchRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.

```java
for (String word : cond.words()) {
    String pattern = "%" + escapeLike(word.toLowerCase(Locale.ROOT)) + "%";
    List<Predicate> anyColumn = new ArrayList<>();
    if (cond.scope().equals("all") || cond.scope().equals("title"))
        anyColumn.add(cb.like(cb.lower(post.get("title")), pattern, '\\'));
    if (cond.scope().equals("all") || cond.scope().equals("content"))
        anyColumn.add(cb.like(cb.lower(post.get("content")), pattern, '\\'));
    if (cond.scope().equals("all") || cond.scope().equals("author"))
        anyColumn.add(cb.like(cb.lower(post.get("author").get("nickname")), pattern, '\\'));
    predicates.add(cb.or(anyColumn.toArray(Predicate[]::new)));
}
```

이 조건을 기존 `viewable()` 조건과 함께 목록·COUNT 쿼리에 적용한다. `escapeLike`는 `%`·`_`·역슬래시를 글자로 검색하도록 바꾼다.

</details>

<details>
<summary>MyBatis Mapper — 같은 검색 계약의 대체 구현</summary>

정답의 **MyBatis 대체 구현 코드** 토글을 선택하면 `MyKeywordSearchMapper.java`·XML과 `MyKeywordSearchRepository.java` 전문을 볼 수 있다. `searchWhere` SQL 조각을 목록·COUNT가 공유하고, 단어별 `AND` 안에서 제목·본문·작성자 조건을 `OR`로 묶는다. `#{pattern}`으로 바인딩하며 `!`를 LIKE 이스케이프 문자로 쓴다.

```xml
<foreach collection="patterns" item="pattern">
  AND (
    <trim prefixOverrides="OR">
      <if test="scope == 'all' or scope == 'title'">OR LOWER(p.title) LIKE #{pattern} ESCAPE '!'</if>
      <if test="scope == 'all' or scope == 'content'">OR LOWER(p.content) LIKE #{pattern} ESCAPE '!'</if>
      <if test="scope == 'all' or scope == 'author'">OR LOWER(a.nickname) LIKE #{pattern} ESCAPE '!'</if>
    </trim>
  )
</foreach>
```

공개 범위·팔로우·차단 조건도 같은 조각에 들어간다. `PostListRow`에 필요한 열만 읽고, 태그는 기존 배치 조회를 사용한다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `InvalidParametersException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleInvalidParameters`.

```java
@ExceptionHandler(InvalidParametersException.class)
public ProblemDetail handleInvalidParameters(InvalidParametersException ex, HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
    problem.setInstance(URI.create(request.getRequestURI()));
    problem.setProperty("errors", ex.getErrors().entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(e -> Map.of("field", e.getKey(), "message", e.getValue()))
            .toList());
    return problem;
}
```

</details>

## 직접 확인

검색어가 다른 글과 겹치지 않게, 먼저 만든 글의 id로 **이번에만 쓰는 단어** `zq<id>x`를 만든다.

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'; K='Authorization: Bearer tok-kimjava'
mk() { curl -s -X POST "$BASE/api/posts" -H "Authorization: Bearer $1" -H "$J" -d "$2" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }
show() { python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("totalElements"), [i["id"] for i in d.get("items", [])], d.get("errors", ""))'; }

N=$(mk tok-c14 '{"boardSlug":"free","title":"[채점] 검색 기준점","content":"x"}'); T="zq${N}x"; echo "T=$T"        # S0
A=$(mk tok-c14 "{\"boardSlug\":\"free\",\"title\":\"[채점] $T 트랜잭션 정리\",\"content\":\"제목에만 있다\"}")       # SA
B=$(mk tok-c15 "{\"boardSlug\":\"free\",\"title\":\"[채점] 본문 검색\",\"content\":\"본문에 $T 트랜잭션 이야기\"}")    # SB
C=$(mk tok-lee "{\"boardSlug\":\"free\",\"title\":\"[채점] $T 팔로워 공개\",\"content\":\"x\",\"visibility\":\"FOLLOWERS\"}")   # SC
D=$(mk tok-kimjava "{\"boardSlug\":\"free\",\"title\":\"[채점] $T 임시저장\",\"content\":\"x\",\"status\":\"DRAFT\"}")      # SD
echo "A=$A B=$B C=$C D=$D"
curl -s "$BASE/api/search/posts?q=$T" | show                                   # Q1 비로그인 → 2 [B, A]
curl -s "$BASE/api/search/posts?q=$T&in=title" | show                          # Q2 → 1 [A]
curl -s "$BASE/api/search/posts?q=$T&in=content" | show                        # Q3 → 1 [B]
curl -s "$BASE/api/search/posts?q=$T" -H "$K" | show                           # Q4 김자바(이스프링 팔로워) → 3
curl -s "$BASE/api/search/posts?q=$T%20%EC%A0%95%EB%A6%AC" | show               # Q5 "T 정리" → 1 [A]
curl -s "$BASE/api/search/posts?q=%EC%9D%B4%EC%8A%A4%ED%94%84%EB%A7%81%20$T" -H "$K" | show   # Q6 "이스프링 T" → 1 [C]
curl -s "$BASE/api/search/posts?q=$T%25" | show                                # Q7 "T%" → 0
curl -s "$BASE/api/search/posts?q=zq${N}_" | show                              # Q8 "zq<id>_" → 0
# 잘못된 파라미터 — 모두 400, 500이 아니어야 한다
for qs in '' 'q=a' 'q=%20%20%20' "q=$(printf 'a%.0s' {1..51})" 'q=a%20b%20c%20d%20e%20f' 'q=ab&in=foo' 'q=a&in=foo' 'q=ab&page=-1&size=0' 'q=ab&size=51' 'q=ab&size=abc'; do
  printf '%-30s ' "$qs"; curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/search/posts?$qs"      # X1~X10
done
curl -s "$BASE/api/search/posts?q=a&in=foo" | show                             # X7 errors에 q와 in 둘 다
curl -s "$BASE/api/search/posts?q=a&in=foo&page=abc&size=nope" | show           # X11 네 필드 오류를 한 번에 수집
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/search/posts?q=zq"          # Y1 정확히 2자 → 200
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/search/posts?q=$(printf 'a%.0s' {1..50})&size=50"   # Y2 정확히 50자, size=50 → 200
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글과 새 검색 단어를 만들어 확인하므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "S0", "title": "S0 기준 글(이 id로 검색 단어를 만든다)", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-c14" }, "body": { "boardSlug": "free", "title": "[채점] 검색 기준점", "content": "x" } },
    { "id": "SA", "title": "SA 제목에 단어", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-c14" }, "body": { "boardSlug": "free", "title": "[채점] zq{{S0.body.id}}x 트랜잭션 정리", "content": "제목에만 있다" } },
    { "id": "SB", "title": "SB 본문에 단어", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-c15" }, "body": { "boardSlug": "free", "title": "[채점] 본문 검색", "content": "본문에 zq{{S0.body.id}}x 트랜잭션 이야기" } },
    { "id": "SC", "title": "SC 이스프링의 팔로워 공개 글", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "boardSlug": "free", "title": "[채점] zq{{S0.body.id}}x 팔로워 공개", "content": "x", "visibility": "FOLLOWERS" } },
    { "id": "SD", "title": "SD 김자바의 임시저장 글", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] zq{{S0.body.id}}x 임시저장", "content": "x", "status": "DRAFT" } },
    { "id": "Q1", "title": "Q1 비로그인 검색", "method": "GET", "path": "/api/search/posts?q=zq{{S0.body.id}}x" },
    { "id": "Q2", "title": "Q2 제목에서만", "method": "GET", "path": "/api/search/posts?q=zq{{S0.body.id}}x&in=title" },
    { "id": "Q3", "title": "Q3 본문에서만", "method": "GET", "path": "/api/search/posts?q=zq{{S0.body.id}}x&in=content" },
    { "id": "Q4", "title": "Q4 김자바(이스프링 팔로워)", "method": "GET", "path": "/api/search/posts?q=zq{{S0.body.id}}x", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q5", "title": "Q5 두 단어 AND(단어 + 정리)", "method": "GET", "path": "/api/search/posts?q=zq{{S0.body.id}}x%20%EC%A0%95%EB%A6%AC" },
    { "id": "Q6", "title": "Q6 작성자 닉네임 + 단어(이스프링 단어)", "method": "GET", "path": "/api/search/posts?q=%EC%9D%B4%EC%8A%A4%ED%94%84%EB%A7%81%20zq{{S0.body.id}}x", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q7", "title": "Q7 % 는 글자(단어%)", "method": "GET", "path": "/api/search/posts?q=zq{{S0.body.id}}x%25" },
    { "id": "Q8", "title": "Q8 _ 는 글자(zq<id>_)", "method": "GET", "path": "/api/search/posts?q=zq{{S0.body.id}}_" },
    { "id": "X1", "title": "X1 q 없음", "method": "GET", "path": "/api/search/posts" },
    { "id": "X2", "title": "X2 q 한 글자", "method": "GET", "path": "/api/search/posts?q=a" },
    { "id": "X3", "title": "X3 q 공백만", "method": "GET", "path": "/api/search/posts?q=%20%20%20" },
    { "id": "X4", "title": "X4 q 51자", "method": "GET", "path": "/api/search/posts?q=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    { "id": "X5", "title": "X5 단어 6개", "method": "GET", "path": "/api/search/posts?q=a%20b%20c%20d%20e%20f" },
    { "id": "X6", "title": "X6 없는 범위", "method": "GET", "path": "/api/search/posts?q=ab&in=foo" },
    { "id": "X7", "title": "X7 q 한 글자 + 없는 범위", "method": "GET", "path": "/api/search/posts?q=a&in=foo" },
    { "id": "X8", "title": "X8 page=-1, size=0", "method": "GET", "path": "/api/search/posts?q=ab&page=-1&size=0" },
    { "id": "X9", "title": "X9 size=51", "method": "GET", "path": "/api/search/posts?q=ab&size=51" },
    { "id": "X10", "title": "X10 size에 문자", "method": "GET", "path": "/api/search/posts?q=ab&size=abc" },
    { "id": "X11", "title": "X11 q·in·page·size 모두 오류", "method": "GET", "path": "/api/search/posts?q=a&in=foo&page=abc&size=nope" },
    { "id": "Y1", "title": "Y1 q 정확히 2자", "method": "GET", "path": "/api/search/posts?q=zq" },
    { "id": "Y2", "title": "Y2 q 정확히 50자, size=50", "method": "GET", "path": "/api/search/posts?q=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&size=50" },
    { "id": "Y3", "title": "Y3 앞뒤·사이 공백 정리", "method": "GET", "path": "/api/search/posts?q=%20%20zq{{S0.body.id}}x%20%20%20%EC%A0%95%EB%A6%AC%20%20" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "Q1",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.totalElements", "equals": 2 },
          { "path": "$.items[0].id", "equals": "{{SB.body.id}}" },
          { "path": "$.items[1].id", "equals": "{{SA.body.id}}" }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        { "request": "Q2", "expect": { "status": 200, "json": [{ "path": "$.totalElements", "equals": 1 }, { "path": "$.items[0].id", "equals": "{{SA.body.id}}" }] } },
        { "request": "Q3", "expect": { "status": 200, "json": [{ "path": "$.totalElements", "equals": 1 }, { "path": "$.items[0].id", "equals": "{{SB.body.id}}" }] } }
      ]
    },
    {
      "id": "C3",
      "request": "Q4",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.totalElements", "equals": 3 },
          { "path": "$.items[*].id", "contains": "{{SC.body.id}}" },
          { "path": "$.items[*].id", "notContains": "{{SD.body.id}}" }
        ]
      }
    },
    { "id": "C4", "request": "Q5", "expect": { "status": 200, "json": [{ "path": "$.totalElements", "equals": 1 }, { "path": "$.items[0].id", "equals": "{{SA.body.id}}" }] } },
    { "id": "C5", "request": "Q6", "expect": { "status": 200, "json": [{ "path": "$.totalElements", "equals": 1 }, { "path": "$.items[0].id", "equals": "{{SC.body.id}}" }] } },
    {
      "id": "C6",
      "all": [
        { "request": "Q7", "expect": { "status": 200, "json": [{ "path": "$.totalElements", "equals": 0 }] } },
        { "request": "Q8", "expect": { "status": 200, "json": [{ "path": "$.totalElements", "equals": 0 }] } }
      ]
    },
    {
      "id": "C7",
      "all": [
        { "request": "X1", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "q" }] } },
        { "request": "X2", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "q" }] } },
        { "request": "X3", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "q" }] } },
        { "request": "X4", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "q" }] } },
        { "request": "X5", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "q" }] } }
      ]
    },
    {
      "id": "C8",
      "all": [
        { "request": "X6", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "in" }] } },
        { "request": "X7", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "q" }, { "path": "$.errors[*].field", "contains": "in" }] } }
      ]
    },
    {
      "id": "C9",
      "all": [
        { "request": "X8", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "page" }, { "path": "$.errors[*].field", "contains": "size" }] } },
        { "request": "X9", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "size" }] } },
        { "request": "X10", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "size" }] } },
        { "request": "X11", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "q" }, { "path": "$.errors[*].field", "contains": "in" }, { "path": "$.errors[*].field", "contains": "page" }, { "path": "$.errors[*].field", "contains": "size" }] } }
      ]
    },
    {
      "id": "C10",
      "all": [
        { "request": "Y1", "expect": { "status": 200 } },
        { "request": "Y2", "expect": { "status": 200 } },
        { "request": "Y3", "expect": { "status": 200, "json": [{ "path": "$.totalElements", "equals": 1 }, { "path": "$.items[0].id", "equals": "{{SA.body.id}}" }] } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `T`는 이번에만 쓰는 단어 `zq<S0의 id>x`, `{A}`~`{D}`는 SA~SD로 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | Q1(비로그인, `q=T`) | `200`, `totalElements`=`2`, `[B, A]` 순서(최신 먼저) — 팔로워 공개 C·임시저장 D는 없다 |
| C2 | Q2 / Q3(`in=title` / `in=content`) | 각각 1건 — A / B |
| C3 | Q4(김자바) | 3건, C가 있고 D(자기 임시저장)는 없다 |
| C4 | Q5(`T 정리`) | 1건 A — 두 단어가 다 있는 글만 |
| C5 | Q6(`이스프링 T`, 김자바) | 1건 C — 닉네임과 제목에 나뉘어 있어도 찾는다 |
| C6 | Q7(`T%`) / Q8(`zq<id>_`) | 둘 다 0건 — `%`·`_`를 글자로 찾았다(와일드카드면 A·B가 나온다) |
| C7 | X1~X5(`q` 없음·1자·공백만·51자·단어 6개) | 모두 `400`, `errors`에 `q` |
| C8 | X6 / X7 | `400`(`in`) / `400`, `errors`에 `q`와 `in` **둘 다** |
| C9 | X8 / X9 / X10 / X11 | `400`(`page`·`size` 둘 다) / `400`(`size`) / `400`(`size`, 숫자 아님) / `400`(`q`·`in`·`page`·`size` 모두) |
| C10 | Y1 / Y2 / Y3 | 경계 안쪽: 정확히 2자 `200` / 정확히 50자·`size=50` `200` / 앞뒤·사이 공백이 섞인 `"  T   정리  "`도 Q5와 같은 1건 |
| D1 | `SELECT COUNT(*) FROM post p JOIN member a ON a.id = p.author_id WHERE p.deleted_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND (p.title LIKE '%T%' OR p.content LIKE '%T%' OR a.nickname LIKE '%T%')` (T 자리에 실제 단어) | `2` — C1의 `totalElements`와 같다 |
| R1 | 단어 조건 조립 | 단어마다 `(제목 OR 본문 OR 닉네임)`을 만들고 단어끼리 AND로 붙였다. 범위(`in`)에 따라 OR 안의 칸만 바뀐다 — 8-4의 조립기에 조건을 더하는 식으로 했다 |
| R2 | LIKE 이스케이프 | `%`·`_`·`\`를 이스케이프하고 `ESCAPE` 문자를 지정했다(8-4의 `escapeLike` 재사용). 문자열을 SQL에 이어 붙이지 않고 파라미터로 넘긴다(SQL 인젝션) |
| R3 | 검사 모으기 | 파라미터 검사를 한 곳에서 하고, 틀린 것을 **모두** `errors`에 담는다. `in`을 `Enum.valueOf`로 바꾸다 터지는 500이 없다 |
| R4 | 성능 | `LIKE '%단어%'`는 앞이 `%`라 B-tree 인덱스를 못 탄다(9-2 EXPLAIN에서 `type=ALL`). 글이 많아지면 MySQL `FULLTEXT`(한글은 `ngram` 파서)나 검색 엔진(Elasticsearch 등)으로 옮긴다는 것을 말할 수 있다 |

## 필요한 지식

- [8-4. 조합 검색 — 동적 쿼리](../ch8-query-deep/8-4-dynamic-search.md) — 같은 쿼리 조립기
- [G2 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 검색에도 "볼 수 있는 글" 규칙이 붙는다
- [J1 EXPLAIN 읽기](../../lessons/J1-reading-explain.md) — 앞이 `%`인 LIKE가 왜 전체를 훑는지
- [R05 인덱스와 B-tree](../../docs/knowledge/R05-index-btree.md)
- [D11 웹 보안 기초](../../docs/knowledge/D11-web-security-basics.md) — SQL 인젝션과 바인딩
- [F1 검증과 에러 응답](../../lessons/F1-validation-errors.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 검색어 정리와 검사</summary>

```java
String normalized = q == null ? "" : q.strip().replaceAll("\\s+", " ");
List<String> words = normalized.isEmpty() ? List.of() : List.of(normalized.split(" "));
```

길이·단어 수·`in`·`page`·`size`를 차례로 보며 틀린 것을 `Map<String, String>`(필드 → 메시지)에 모은 뒤, 비어 있지 않으면 예외 하나로 던진다. 전역 핸들러에서 그 맵을 `errors: [{field, message}]`로 바꾼다. `page`·`size`를 `String`으로 받은 뒤 정수 변환 오류까지 같은 맵에 모아야 다른 필드 오류가 누락되지 않는다.
</details>

<details>
<summary>힌트 2 — 8-4 조립기에 단어 조건 더하기</summary>

`PostSearchCondition`에 단어 목록과 범위를 더하고, `PostSearchRepository.conditions()`에서:

```java
for (String word : cond.words()) {
    String pattern = "%" + escapeLike(word.toLowerCase(Locale.ROOT)) + "%";
    List<Predicate> anyColumn = new ArrayList<>();
    if (scope is all or title)   anyColumn.add(cb.like(cb.lower(post.get("title")), pattern, '\\'));
    if (scope is all or content) anyColumn.add(cb.like(cb.lower(post.get("content")), pattern, '\\'));
    if (scope is all or author)  anyColumn.add(cb.like(cb.lower(post.get("author").get("nickname")), pattern, '\\'));
    predicates.add(cb.or(anyColumn.toArray(Predicate[]::new)));
}
```

"볼 수 있는 글" 조건(`viewable`)은 이미 같은 메서드에서 붙으므로 따로 할 일이 없다.
</details>

## 다음 단계

[11-5. 휴지통 — 지운 글 모아 보기와 복구](11-5-trash-restore.md)
