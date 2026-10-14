# 6-5. 내가 표시한 글 — 좋아요·북마크 조건 조합

## 상황

> "좋아요한 글, 북마크한 글을 한 화면에서 보고 싶어요. 두 조건을 모두 켜면 둘 다 한 글만 보여 주세요."

4장의 `post_like`와 6장의 `bookmark`를 **함께 조회**한다. 좋아요 또는 북마크한 **공개 글**을 모아 보고, 쿼리 파라미터로 하나 또는 둘 다 있는 글만 걸러낸다. 작성자가 나라는 뜻의 "내 글" 목록과 다르다.

## 화면 시나리오

```screen
{
  "title": "내가 표시한 글",
  "summary": "좋아요·북마크 관계를 동시에 조회해 상태를 응답 DTO에 넣는다.",
  "screen": [
    { "type": "select", "id": "filter", "label": "필터", "value": "좋아요와 북마크 모두" },
    { "type": "list", "id": "posts", "items": [{ "id": "p1", "title": "[표시실습] 둘 다", "meta": "이스프링 · 좋아요 · 북마크" }] }
  ],
  "flows": [{
    "name": "두 조건의 교집합",
    "steps": [
      { "kind": "request", "method": "GET", "path": "/api/me/posts?liked=true&bookmarked=true&page=0&size=20", "headers": ["Authorization: Bearer tok-kimjava"] },
      { "kind": "server", "text": "서비스가 토큰 회원의 두 관계가 모두 있는 공개 글만 DB에서 페이지로 읽는다" },
      { "kind": "db", "sql": "SELECT p.id,p.title FROM post p JOIN post_like l ON l.post_id=p.id AND l.member_id=2 JOIN bookmark bm ON bm.post_id=p.id AND bm.member_id=2 WHERE p.status='PUBLISHED' AND p.visibility='PUBLIC' AND p.deleted_at IS NULL ORDER BY p.id DESC LIMIT 20", "note": "두 JOIN이 모두 성립해야 목록에 나온다" },
      { "kind": "response", "status": 200, "body": "{\"items\":[{\"postId\":22,\"title\":\"[표시실습] 둘 다\",\"authorNickname\":\"이스프링\",\"boardSlug\":\"dev\",\"liked\":true,\"bookmarked\":true}],\"page\":0,\"size\":20,\"totalElements\":1}" },
      { "kind": "screen", "text": "두 표시가 모두 있는 글을 표시한다", "focus": ["posts"] }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | `GET /api/me/posts?liked=&bookmarked=&page=&size=`. 인증 필수, 회원은 토큰에서 가져온다. |
| 조건 | 두 값 생략/`false`면 좋아요 **또는** 북마크가 있는 글. `liked=true`만 주면 좋아요한 글, `bookmarked=true`만 주면 북마크한 글, 둘 다 `true`면 교집합. |
| 목록 대상 | `PUBLISHED`·`PUBLIC`·미삭제 글 중 2-3의 차단 규칙에 걸리지 않는 글. 6-3처럼 볼 수 없는 북마크를 별도 항목으로 내보내는 목록이 아니다. |
| 응답 DTO | `{ "items": [{ "postId", "title", "authorNickname", "boardSlug", "liked", "bookmarked" }], "page", "size", "totalElements" }`. `postId DESC`. |
| 입력·실패 | `liked`·`bookmarked`는 생략하거나 정확히 `true`/`false`만 받는다. 빈 값도 형식 오류다. `page` 기본 0·최소 0, `size` 기본 20·범위 1~100. 형식/범위 오류 `400`, 인증 없음 `401`. 결과가 없으면 `items:[]`, `totalElements:0`. 유효하지만 범위를 훨씬 넘는 페이지는 빈 `items`와 전체 건수를 반환한다. |

## 구현 가이드

먼저 좋아요 목록 한 조건을 완성한 뒤 북마크 조건과 교집합을 추가한다. 마지막에 응답 항목의 두 상태와 `totalElements`를 맞춘다.

<details>
<summary>Controller — 두 필터와 페이지 입력 검증</summary>

두 필터를 `required=false` 문자열로 받아 생략(`null`)과 빈 값(`""`)을 구별한다. 정확히 `true`/`false`인지 확인한다. Spring의 boolean 자동 변환은 `yes`·`1`도 받을 수 있고 `defaultValue`는 빈 값을 생략처럼 처리하므로, 여기서는 요청 형식 오류를 명시적으로 `400`으로 처리한다. `page`·`size`도 문자열로 받아 생략일 때만 기본값 0·20을 적용하고, 빈 값·숫자 외 문자열·범위 밖 값은 `400`이다. 회원 ID는 요청에 받지 않는다.

```java
@GetMapping("/api/me/posts")
public MarkedPostPageResponse markedPosts(
        @RequestParam(required = false) String liked,
        @RequestParam(required = false) String bookmarked,
        @RequestParam(required = false) String page,
        @RequestParam(required = false) String size,
        @LoginMember AuthenticatedMember loginMember) {
    return markedPostService.list(loginMember.id(),
            parseBoolean(liked), parseBoolean(bookmarked),
            parseNumber(page, 0, 0, Integer.MAX_VALUE),
            parseNumber(size, 20, 1, 100));
}

private boolean parseBoolean(String value) {
    if (value == null) return false;
    if ("true".equals(value)) return true;
    if ("false".equals(value)) return false;
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
}

private int parseNumber(String value, int fallback, int min, int max) {
    if (value == null) return fallback;
    if (!value.matches("[0-9]+")) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }
    try {
        int number = Integer.parseInt(value);
        if (number >= min && number <= max) return number;
    } catch (NumberFormatException ignored) { }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
}
```

`page < 0`과 `size < 1 || size > 100`을 쓰기 전에 `400`으로 거절한다. 인증 없는 요청은 `401`이다.

</details>

<details>
<summary>DTO — 글 정보·두 표시·페이지 메타데이터</summary>

```java
public record MarkedPostItem(Long postId, String title,
        String authorNickname, String boardSlug,
        boolean liked, boolean bookmarked) { }
public record MarkedPostPageResponse(List<MarkedPostItem> items,
        int page, int size, long totalElements) { }
```

`liked`와 `bookmarked`는 **지금 로그인한 회원**과 글의 관계 여부다. `items`를 20개 읽은 뒤 Java에서 필터링하면 페이지와 `totalElements`가 틀어진다.

</details>

<details>
<summary>Service — 글 페이지와 관계 상태를 묶어 DTO 만들기</summary>

먼저 필터·차단·공개 조건을 적용한 글 페이지와 같은 조건의 총 개수를 DB에서 얻는다. `author`·`board`는 `@EntityGraph`로 함께 읽고, 현재 회원의 좋아요·북마크 상태는 페이지 ID들에 대해서만 각각 한 번에 조회한다.

```java
Page<Post> posts = postRepository.findMarkedPosts(memberId, liked, bookmarked,
        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")));
List<Long> ids = posts.getContent().stream().map(Post::getId).toList();
```

관계 상태를 일괄 조회한 다음 `posts.getContent()` 순서대로 DTO를 만든다. `posts.getTotalElements()`를 응답의 `totalElements`에 쓴다.

두 조건을 모두 생략하면 관계 중 하나 이상인 글만, 둘 다 `true`면 둘 다 있는 글만 반환한다. **전체 일치 글이 없을 때만** `totalElements:0`이다. 범위를 넘는 `page`를 요청해 `items:[]`가 되어도 `totalElements`는 전체 일치 건수를 유지한다.

JPA/Hibernate의 조회 시작 위치는 `int` 범위이므로 `(long) page * size > Integer.MAX_VALUE`인 유효한 요청은 큰 OFFSET 쿼리를 실행하지 않는다. 같은 필터로 첫 페이지를 크기 1로 조회해 `totalElements`만 얻고 빈 `items`를 반환한다. MyBatis는 `long` 오프셋을 SQL에 바인딩하므로 두 구현의 응답 계약은 같다.

</details>

<details>
<summary>JPA / Repository — EXISTS로 필터한 뒤 페이지 읽기</summary>

먼저 SQL로 관계를 눈으로 본다. `post_like`와 `bookmark`는 각각 회원·글 쌍에 UNIQUE가 있어서 한 글이 여러 행으로 불어나지 않는다. 아래는 **두 조건이 모두 true**일 때의 완성 SQL이다. 자기 회원 ID 2를 대입해 시드 데이터와 새로 만든 글의 결과를 확인한다.

```sql
SELECT p.id, p.title, a.nickname, b.slug,
       (l.id IS NOT NULL) AS liked, (bm.id IS NOT NULL) AS bookmarked
FROM post p
JOIN member a ON a.id = p.author_id
JOIN board b ON b.id = p.board_id
LEFT JOIN post_like l ON l.post_id = p.id AND l.member_id = 2
LEFT JOIN bookmark bm ON bm.post_id = p.id AND bm.member_id = 2
WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM member_block mb
    WHERE (mb.blocker_id = 2 AND mb.blocked_id = a.id)
       OR (mb.blocker_id = a.id AND mb.blocked_id = 2)
  )
  AND l.id IS NOT NULL AND bm.id IS NOT NULL
ORDER BY p.id DESC
LIMIT 20 OFFSET 0;
```

다음 순서로 직접 바꾼다. ① `AND bm.id IS NOT NULL`만 빼서 좋아요 목록, ② `AND l.id IS NOT NULL`만 빼서 북마크 목록, ③ 두 줄 대신 `AND (l.id IS NOT NULL OR bm.id IS NOT NULL)`을 넣어 전체 표시 목록을 만든다. `COUNT(*)` 쿼리도 `LIMIT/OFFSET`만 빼고 **같은 WHERE**를 써야 `totalElements`가 맞는다. 관계가 없는 글까지 읽은 뒤 Java에서 거르면 페이지가 20개보다 적게 차는 오류가 생긴다.

JPA에서는 `Post`의 `likes` 컬렉션을 새로 만들 필요가 없다. `PostLike`와 `Bookmark`에 이미 `post`·`member` 연관 필드가 있으므로 `EXISTS` 서브쿼리로 `Post` 페이지를 직접 읽는다. `@EntityGraph(attributePaths = {"author", "board"})`로 응답에 필요한 두 관계를 함께 읽는다. 다음 세 조건을 모두 `WHERE`에 넣고, 공개·미삭제·차단 제외 조건까지 같은 `countQuery`에 복사한다.

```java
AND (:liked = false OR EXISTS (SELECT 1 FROM PostLike l
    WHERE l.member.id = :memberId AND l.post = p))
AND (:bookmarked = false OR EXISTS (SELECT 1 FROM Bookmark bm
    WHERE bm.member.id = :memberId AND bm.post = p))
AND (EXISTS (SELECT 1 FROM PostLike l WHERE l.member.id = :memberId AND l.post = p)
     OR EXISTS (SELECT 1 FROM Bookmark bm WHERE bm.member.id = :memberId AND bm.post = p))
```

글 페이지를 얻은 뒤 **그 페이지 ID들에 대해서만** 좋아요/북마크 관계를 각각 한 번에 조회해 DTO의 두 boolean을 채운다. 항목마다 두 관계를 따로 SELECT하지 않는다. 전체 `@Query`와 `countQuery`는 아래 `PostRepository.java` 접기에서 확인한다. 8-4의 동적 검색에서 이 조건 조립을 더 확장한다.

</details>

<details>
<summary>MyBatis / SQL — 동적 조건과 COUNT를 같은 WHERE로 조회하기</summary>

MyBatis를 설정한 경우 같은 `LEFT JOIN` 결과에 `<choose>`로 세 필터를 넣을 수 있다. 아래는 WHERE에 붙이는 조각이다. `#{memberId}`로 회원을 바인딩하고 정렬의 컬럼 이름은 고정한다.

```xml
<choose>
  <when test="liked and bookmarked">
    AND l.id IS NOT NULL AND bm.id IS NOT NULL
  </when>
  <when test="liked">
    AND l.id IS NOT NULL
  </when>
  <when test="bookmarked">
    AND bm.id IS NOT NULL
  </when>
  <otherwise>
    AND (l.id IS NOT NULL OR bm.id IS NOT NULL)
  </otherwise>
</choose>
```

목록과 `COUNT(*)`가 **같은** 공개·차단·표시 조건을 쓰도록 공통 `<sql>` 조각으로 묶는다. 응답 DTO 조립과 인증 검사는 JPA 방식과 같다. MyBatis 의존성은 [10-7 선택 과제](../ch10-project/10-7-post-list.md#선택--같은-목록을-mybatis로-짜-보기)를 참조한다.

```java
long total = markedPosts.countMarkedPosts(memberId, liked, bookmarked);
List<MarkedPostItem> items = markedPosts.findMarkedPosts(memberId, liked, bookmarked,
        size, (long) page * size).stream()
        .map(row -> new MarkedPostItem(row.postId, row.title, row.authorNickname,
                row.boardSlug, Boolean.TRUE.equals(row.liked),
                Boolean.TRUE.equals(row.bookmarked)))
        .toList();
return new MarkedPostPageResponse(items, page, size, total);
```

```xml
<select id="findMarkedPosts" resultType="org.example.marked.MarkedPostRow">
    SELECT p.id AS post_id, p.title,
           author.nickname AS author_nickname, board_ref.slug AS board_slug,
           (l.id IS NOT NULL) AS liked, (bm.id IS NOT NULL) AS bookmarked
    <include refid="markedFromWhere" />
    ORDER BY p.id DESC
    LIMIT #{limit} OFFSET #{offset}
</select>
<select id="countMarkedPosts" resultType="long">
    SELECT COUNT(*)
    <include refid="markedFromWhere" />
</select>
```

`markedFromWhere`에 위 `<choose>`뿐 아니라 `post`의 공개·미삭제 조건과 `member_block` 차단 제외, `post_like`·`bookmark`의 회원별 `LEFT JOIN`을 함께 둔다. MyBatis 대체 구현 토글에서 `MarkedPostController.java`, `MarkedPostRow.java`, `MyBatisMarkedPostService.java`, `MyBatisMarkedPostMapper.java`와 XML 전문을 볼 수 있다.

</details>

## 직접 확인

이스프링 토큰으로 공개 글 두 개를 만들고, 김자바가 둘 다 좋아요한다. 첫 글만 북마크한다. 새 글 ID가 가장 크므로 최신순 첫 항목으로 차이를 확인한다.

```check
{
  "requests": [
    { "id": "P1", "title": "둘 다 표시할 글", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "boardSlug": "dev", "title": "[표시실습] 둘 다", "content": "좋아요와 북마크를 모두 적용합니다.", "tags": [], "visibility": "PUBLIC" } },
    { "id": "P2", "title": "좋아요만 표시할 글", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "boardSlug": "dev", "title": "[표시실습] 좋아요만", "content": "좋아요만 적용합니다.", "tags": [], "visibility": "PUBLIC" } },
    { "id": "L1", "title": "첫 글 좋아요", "method": "PUT", "path": "/api/posts/{{P1.body.id}}/like", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "L2", "title": "둘째 글 좋아요", "method": "PUT", "path": "/api/posts/{{P2.body.id}}/like", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "B1", "title": "첫 글 북마크", "method": "PUT", "path": "/api/posts/{{P1.body.id}}/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": {} },
    { "id": "Q1", "title": "좋아요만", "method": "GET", "path": "/api/me/posts?liked=true&page=0&size=20", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q2", "title": "두 조건 모두", "method": "GET", "path": "/api/me/posts?liked=true&bookmarked=true&page=0&size=20", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q3", "title": "북마크만", "method": "GET", "path": "/api/me/posts?bookmarked=true&page=0&size=20", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q4", "title": "인증 없음", "method": "GET", "path": "/api/me/posts" },
    { "id": "Q5", "title": "잘못된 크기", "method": "GET", "path": "/api/me/posts?size=0", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q6", "title": "아주 먼 페이지", "method": "GET", "path": "/api/me/posts?liked=true&page=2147483647&size=100", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q7", "title": "잘못된 좋아요 값", "method": "GET", "path": "/api/me/posts?liked=yes", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q8", "title": "잘못된 북마크 값", "method": "GET", "path": "/api/me/posts?bookmarked=1", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q9", "title": "빈 좋아요 값", "method": "GET", "path": "/api/me/posts?liked=", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q10", "title": "빈 북마크 값", "method": "GET", "path": "/api/me/posts?bookmarked=", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q11", "title": "빈 페이지 값", "method": "GET", "path": "/api/me/posts?page=", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Q12", "title": "빈 크기 값", "method": "GET", "path": "/api/me/posts?size=", "headers": { "Authorization": "Bearer tok-kimjava" } }
  ],
  "checks": [
    { "id": "C1", "all": [{ "request": "P1", "expect": { "status": 201 } }, { "request": "P2", "expect": { "status": 201 } }, { "request": "L1", "expect": { "status": 200 } }, { "request": "L2", "expect": { "status": 200 } }, { "request": "B1", "expect": { "status": 200 } }] },
    { "id": "C2", "request": "Q1", "expect": { "status": 200, "json": [{ "path": "$.items[0].postId", "equals": "{{P2.body.id}}" }, { "path": "$.items[0].liked", "equals": true }, { "path": "$.items[0].bookmarked", "equals": false }] } },
    { "id": "C3", "request": "Q2", "expect": { "status": 200, "json": [{ "path": "$.items[0].postId", "equals": "{{P1.body.id}}" }, { "path": "$.items[0].liked", "equals": true }, { "path": "$.items[0].bookmarked", "equals": true }] } },
    { "id": "C4", "request": "Q3", "expect": { "status": 200, "json": [{ "path": "$.items[0].postId", "equals": "{{P1.body.id}}" }] } },
    { "id": "C5", "request": "Q4", "expect": { "status": 401 } },
    { "id": "C6", "request": "Q5", "expect": { "status": 400 } },
    { "id": "C7", "request": "Q6", "expect": { "status": 200, "json": [{ "path": "$.items", "length": 0 }, { "path": "$.totalElements", "equals": "{{Q1.body.totalElements}}" }] } },
    { "id": "C8", "request": "Q7", "expect": { "status": 400 } },
    { "id": "C9", "request": "Q8", "expect": { "status": 400 } },
    { "id": "C10", "request": "Q9", "expect": { "status": 400 } },
    { "id": "C11", "request": "Q10", "expect": { "status": 400 } },
    { "id": "C12", "request": "Q11", "expect": { "status": 400 } },
    { "id": "C13", "request": "Q12", "expect": { "status": 400 } }
  ]
}
```

SQL로 `SELECT p.id,l.id AS like_id,bm.id AS bookmark_id FROM post p LEFT JOIN post_like l ON l.post_id=p.id AND l.member_id=2 LEFT JOIN bookmark bm ON bm.post_id=p.id AND bm.member_id=2 WHERE p.id IN ({P1의 id},{P2의 id})`를 실행한다. P1은 두 ID가 있고 P2는 `bookmark_id`만 `NULL`이다. `Q2`의 첫 항목이 P1이어야 하는 이유를 이 두 행으로 설명한다.

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1~C4 | 데이터 준비·세 필터 | 좋아요 첫 글 P2, 교집합·북마크 첫 글 P1, DTO의 두 상태 일치 |
| C5~C13 | 인증·페이지 크기·아주 먼 페이지·필터/페이지 빈 값 | `401`·`400`·빈 목록과 전체 건수 유지 |
| D1 | `post`·`post_like`·`bookmark` JOIN | P1은 두 관계, P2는 좋아요만. 페이지에서 중복 글 없음 |
| R1 | Repository·Service | 필터와 개수 조건이 DB에 있고, 페이지 항목별 추가 쿼리가 없다 |

## 필요한 지식

- [2-5. JPA 쿼리 작성](../ch2-read-post/2-5-guided-jpa-query.md)
- [4-3. 내가 좋아요한 글](../ch4-like/4-3-my-likes.md)
- [6-3. 내 북마크 목록](6-3-my-bookmarks.md)

## 다음 단계

[7-1. 컨트롤러 테스트](../ch7-tests/7-1-controller-slice.md) — 조건 조합과 권한을 테스트로 고정한다.
