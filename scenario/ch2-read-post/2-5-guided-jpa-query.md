# 2-5. JPA 쿼리 작성 — 예시에서 JOIN까지

## 상황

> "회원 프로필에 그 사람이 개발 게시판에 쓴 공개 글 목록을 보여주세요. 글 제목과 작성자 이름이 필요하고, 삭제하거나 비공개인 글은 빼주세요."

2-1~2-4에서 단건·게시판 목록·조회 권한·N+1을 다뤘다. 이번에는 **같은 데이터를 SQL로 먼저 확인하고** `PostRepository`의 파생 쿼리와 JPQL `@Query`를 직접 작성해 새 조회 API를 만든다. 완성 예시를 보고 조건을 하나씩 늘린다. 답을 외우는 단계가 아니라 DB 열과 엔티티 필드가 어떻게 연결되는지 확인하는 단계다.

## 화면 시나리오

```screen
{
  "title": "회원의 게시판 글",
  "summary": "이스프링이 개발 게시판에 공개한 글만 제목·작성자 이름으로 본다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "이스프링의 글" },
    { "type": "text", "id": "board", "value": "개발 게시판", "emphasis": "caption" },
    { "type": "text", "id": "post", "value": "JPA 연관관계 매핑 정리 · 이스프링", "emphasis": "title" }
  ],
  "flows": [{
    "name": "글 목록 조회",
    "steps": [
      { "kind": "request", "method": "GET", "path": "/api/members/3/posts?board=dev" },
      { "kind": "server", "text": "회원·게시판을 확인하고, 공개·발행·미삭제 조건으로 PostRepository를 호출한다" },
      { "kind": "db", "sql": "SELECT p.id, p.title, m.nickname FROM post p JOIN member m ON m.id=p.author_id JOIN board b ON b.id=p.board_id WHERE m.id=3 AND b.slug='dev' AND p.status='PUBLISHED' AND p.visibility='PUBLIC' AND p.deleted_at IS NULL", "note": "실제 조건을 SQL로 먼저 검산" },
      { "kind": "response", "status": 200, "body": "[{\"id\":2,\"title\":\"JPA 연관관계 매핑 정리\",\"authorNickname\":\"이스프링\",\"boardSlug\":\"dev\"}]" },
      { "kind": "screen", "text": "공개 글 하나를 표시한다", "focus": ["post"] }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | `GET /api/members/{memberId}/posts?board={slug}`. `board`는 필수 쿼리 파라미터다. |
| 인증 | 필요 없음. 누구나 볼 수 있는 `PUBLISHED`·`PUBLIC`·미삭제 글만 보여준다. |
| 성공 | `200`, `[{ "id": 2, "title": "JPA 연관관계 매핑 정리", "authorNickname": "이스프링", "boardSlug": "dev" }]`. 새 글이 없는 회원은 `[]`. |
| 정렬 | `published_at DESC, id DESC` — 같은 시각이어도 순서가 정해진다. |
| 실패 | `memberId`가 숫자가 아니거나 `board`가 비면 `400`; 회원·게시판이 없으면 `404`. |
| 구현 | Controller는 경로/쿼리를 받아 응답 DTO로 변환, Service는 회원·게시판 확인, Repository는 DB 조건으로 필터링한다. 목록을 전부 읽어 Java에서 거르지 않는다. |

시드에서 회원 3은 이스프링이고 개발 게시판(`dev`)의 글 2번을 썼다. **1-6을 풀며 이스프링으로 만든 공개 글이 있다면 함께 나온다.** 회원 4는 존재하지만 `dev`에 공개 글이 없으므로 `200 []`다. 글 8은 삭제됐고 6은 팔로워 공개이므로 비로그인 응답에 넣지 않는다. 이미 가진 게시판 목록 API를 바꾸지 말고 **새 API**로 작성한다.

## 구현 가이드

`GET` 요청을 받는 Controller, 회원·게시판을 확인하는 Service, DB 조건을 적용하는 Repository 순서로 만든다. 아래 JPA 코드와 MyBatis 대체 코드는 단계별 전체 코드 접기에서 파일별로 볼 수 있다.

<details>
<summary>Controller — 경로와 필수 쿼리 받기</summary>

`board`를 필수 `@RequestParam`으로 받으면 누락된 요청은 Controller 본문에 들어오기 전에 `400`이 된다.

```java
@GetMapping("/api/members/{memberId}/posts")
public List<PostHeadlineResponse> list(@PathVariable Long memberId,
                                        @RequestParam @NotBlank String board) {
    return postQueryService.listPublicByAuthor(memberId, board);
}
```

</details>

<details>
<summary>DTO — 엔티티 대신 네 필드 반환</summary>

응답을 `Post` 엔티티로 바로 보내지 않는다. 목록에서 필요한 값만 고정한다.

```java
public record PostHeadlineResponse(
        Long id, String title, String authorNickname, String boardSlug) {}
```

목록이 비면 `List.of()` 또는 빈 조회 결과를 그대로 반환한다. DTO의 필드 이름은 `check`의 JSON 경로와 같다.

</details>

<details>
<summary>Service — 없는 회원·게시판과 빈 목록 구분</summary>

존재 확인을 먼저 해야 "회원은 있지만 글이 없음"이 `404`가 아니라 `200 []`가 된다. `BoardRepository.findBySlug`를 사용한다.

```java
@Transactional(readOnly = true)
public List<PostHeadlineResponse> listPublicByAuthor(Long memberId, String boardSlug) {
    if (!memberRepository.existsById(memberId)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다.");
    }
    boardRepository.findBySlug(boardSlug)
            .orElseThrow(() -> new BoardNotFoundException(boardSlug));
    return postRepository.findPublicPostsByAuthorAndBoard(memberId, boardSlug)
            .stream().map(post -> new PostHeadlineResponse(
                    post.getId(), post.getTitle(),
                    post.getAuthor().getNickname(), boardSlug)).toList();
}
```

DTO의 `boardSlug`는 검증한 쿼리값을 사용하므로 각 글의 `board`를 다시 지연 로딩하지 않는다. `@NotBlank`가 붙은 Controller의 빈 `board` 요청은 `400`인지 확인한다.

</details>

<details>
<summary>JPA / Repository — SQL JOIN을 JPQL로 옮기기</summary>

### 1. SQL로 기대 결과 보기

다음은 `post`·`member`·`board`의 외래키를 이용한 완성 예시다. `community`에서 그대로 실행한다. 먼저 **WHERE를 빼고** 세 테이블의 연결을 확인한 뒤, `m.id`·`b.slug`·공개 조건을 하나씩 붙여 결과가 어떻게 줄어드는지 본다.

```sql
SELECT p.id, p.title, m.nickname, b.slug
FROM post p
JOIN member m ON m.id = p.author_id
JOIN board b ON b.id = p.board_id
WHERE m.id = 3
  AND b.slug = 'dev'
  AND p.status = 'PUBLISHED'
  AND p.visibility = 'PUBLIC'
  AND p.deleted_at IS NULL
ORDER BY p.published_at DESC, p.id DESC;
```

`m.id=3`을 `4`로 바꾸면 빈 결과가 나온다. `b.slug='free'`로 바꾸면 다른 글이 나온다. `post`의 `author_id`와 `board_id`가 왜 두 JOIN 조건인지 [1-7의 직접 DB 확인](../ch1-create-post/1-7-direct-db-dml.md)에서 본 행과 대조한다.

### 2. Repository 쿼리로 옮기기

파생 메서드의 가장 작은 출발점은 다음과 같다. 엔티티의 `author.id`와 `deletedAt` 필드를 읽어 메서드 이름을 SQL 조건으로 바꾼다. 아래 코드를 먼저 실행하고 글 8처럼 삭제된 행이 빠지는지 확인한다.

```java
List<Post> findByAuthor_IdAndDeletedAtIsNullOrderByIdDesc(Long memberId);
```

이번에는 **작성자 ID와 게시판**이라는 두 조건이 필요하다. 파생 메서드 이름에 `Author_Id`·`Board_Slug`를 붙이고 `Status`·`Visibility` 조건까지 늘리는 방법을 먼저 시도한다. 이름이 길어지면 아래처럼 JPQL `@Query`로 조건을 드러낸다. `Post`·`Board`·`Member`는 엔티티 이름과 연관 필드이고, `post`·`board`·`member`는 SQL의 테이블 이름이다.

```java
@Query("""
    SELECT p FROM Post p
    JOIN FETCH p.author a
    JOIN p.board b
    WHERE a.id = :memberId
      AND b.slug = :boardSlug
      AND p.status = 'PUBLISHED'
      AND p.visibility = 'PUBLIC'
      AND p.deletedAt IS NULL
    ORDER BY p.publishedAt DESC, p.id DESC
    """)
List<Post> findPublicPostsByAuthorAndBoard(
    @Param("memberId") Long memberId,
    @Param("boardSlug") String boardSlug);
```

처음에는 위 JPQL을 그대로 써서 SQL 예시와 결과를 맞춘다. 다음에는 `JOIN FETCH p.author`를 `JOIN p.author`로 바꾸고 `authorNickname` DTO를 만들 때 SQL이 몇 번 나가는지 로그를 비교한다. 마지막으로 엔티티 전체 대신 필요한 네 필드만 선택하는 DTO projection을 직접 작성해 본다. 전체 행의 개수와 순서가 유지되어야 한다.

목록을 반환할 때 `Post` 엔티티를 JSON으로 바로 보내지 않는다. `PostHeadlineResponse` 같은 응답 DTO를 만들어 `id`·`title`·`authorNickname`·`boardSlug`만 내보낸다. 회원·게시판의 존재 확인은 Service에서 먼저 하므로, **없는 회원/게시판은 `404`**, 존재하지만 글이 없으면 `200 []`가 된다.

</details>

<details>
<summary>MyBatis / SQL — 같은 조건을 Mapper에 쓰기</summary>

JPA 단계 코드에서 MyBatis로 바뀌는 12개 파일은 전체 코드 접기의 MyBatis 대체 구현에 있다. `PostHeadlineRow`는 조회 결과, `PostVisibilityMapper`는 회원 확인과 목록 SQL, `PostQueryService`는 404/빈 배열 구분을 담당한다. `@Mapper` 인터페이스의 메서드는 `selectPublicByAuthorAndBoard(@Param("memberId") Long memberId, @Param("boardSlug") String boardSlug)`처럼 두 입력을 받는다.

```xml
<select id="selectPublicByAuthorAndBoard" resultType="org.example.post.PostHeadlineRow">
  SELECT p.id, p.title, m.nickname AS author_nickname, b.slug AS board_slug
  FROM post p
  JOIN member m ON m.id = p.author_id
  JOIN board b ON b.id = p.board_id
  WHERE m.id = #{memberId} AND b.slug = #{boardSlug}
    AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    AND p.deleted_at IS NULL
  ORDER BY p.published_at DESC, p.id DESC
</select>
```

`PostHeadlineRow`에는 조회 열에 대응하는 public 필드를 두고, `map-underscore-to-camel-case`로 별칭을 연결한다. Mapper 결과를 위 응답 DTO로 변환한다.

회원·게시판 존재 확인과 `404`/빈 배열 구분은 JPA 방식과 동일하게 Service에서 처리한다. 이 단계의 MyBatis 대체 구현에는 `build.gradle` 의존성, `application.yml` 설정, Mapper XML이 모두 포함되어 있다.

```java
public class PostHeadlineRow {
    public Long id;
    public String title;
    public String authorNickname;
    public String boardSlug;
}
```

이 클래스는 `org.example.post` 패키지에 둔다. `application.yml`의 `map-underscore-to-camel-case: true`가 SQL 별칭을 필드에 연결한다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

```check
{
  "requests": [
    { "id": "A", "title": "이스프링의 개발 글", "method": "GET", "path": "/api/members/3/posts?board=dev" },
    { "id": "B", "title": "글 없는 회원", "method": "GET", "path": "/api/members/4/posts?board=dev" },
    { "id": "C", "title": "없는 회원", "method": "GET", "path": "/api/members/999999/posts?board=dev" },
    { "id": "D", "title": "없는 게시판", "method": "GET", "path": "/api/members/3/posts?board=nope" },
    { "id": "E", "title": "잘못된 회원 ID", "method": "GET", "path": "/api/members/abc/posts?board=dev" },
    { "id": "F", "title": "게시판 누락", "method": "GET", "path": "/api/members/3/posts" }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [{ "path": "$[*].id", "contains": 2 }, { "path": "$[0].authorNickname", "equals": "이스프링" }, { "path": "$[0].boardSlug", "equals": "dev" }] } },
    { "id": "C2", "request": "B", "expect": { "status": 200, "json": [{ "path": "$", "length": 0 }] } },
    { "id": "C3", "request": "C", "expect": { "status": 404 } },
    { "id": "C4", "request": "D", "expect": { "status": 404 } },
    { "id": "C5", "request": "E", "expect": { "status": 400 } },
    { "id": "C6", "request": "F", "expect": { "status": 400 } }
  ]
}
```

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1 | 공개 글 조회 | 시드 글 2 포함, DTO의 작성자·게시판 값 일치. 앞 단계에서 이스프링으로 만든 공개 글도 함께 조회 |
| C2 | 존재하는 회원의 빈 목록 | `200 []`, `404`가 아니다 |
| C3~C4 | 없는 회원·게시판 | 각각 `404` |
| C5~C6 | 잘못된 입력 | `400`, `500`이 아니다 |
| R1 | Repository | WHERE의 작성자·게시판·발행·공개·미삭제 조건이 DB에서 적용된다. 목록 전체를 읽어 메모리에서 필터링하지 않는다. |
| R2 | SQL 로그 | SQL과 JPQL의 JOIN·WHERE·ORDER BY가 같은 결과를 만든다. 작성자마다 추가 SELECT가 나가지 않는다. |
| R3 | DTO | 엔티티를 그대로 응답하지 않고 네 필드만 돌려준다. |

## 필요한 지식

- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md) — 파생 쿼리가 SQL이 되는 과정
- [E4 JPA 연관관계](../../lessons/E4-jpa-associations.md) — `JOIN FETCH`와 N+1
- [E2 DB와 SQL 기초](../../lessons/E2-db-sql-basics.md) — JOIN과 WHERE
- [2-4. 쿼리 수 줄이기](2-4-n-plus-1.md) — 응답 DTO를 만들 때의 추가 SELECT

## 다음 단계

[3-0. PUT으로 게시글 전체 교체](../ch3-update-delete/3-0-put-replace.md) — 조회한 글의 모든 수정 필드를 바꾼다. 여러 조건을 조합한 조회는 8-4에서 확장한다.
