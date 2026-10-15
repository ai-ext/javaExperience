# 11-3. 조회수 — 같은 사람은 하루 한 번

> 시나리오 DB(`community`). 이번 단계 마이그레이션은 `V21`이다.

## 상황

> "인기글 순위를 조회수로 매기려는데, 글쓴이가 새로고침을 연타하면 조회수가 수십씩 올라가요. 같은 사람이 하루에 여러 번 봐도 한 번으로 쳐 주세요. 자기 글은 아예 세지 말고요."

지금 상세 조회(`GET /api/posts/{id}`)는 열 때마다 `view_count`를 1 올린다(2-1). "누가 봤는지"를 기억하지 않으니 같은 사람의 새로고침도 전부 1씩이다.

**"누가 언제 봤나"를 기록하는 표**를 하나 만들고, 그 표에 **오늘 처음 행이 생길 때만** 조회수를 올린다. 같은 회원·같은 글·같은 날짜는 한 행만 있을 수 있게 키를 걸어 두면, "처음인가?"는 그 행이 새로 생겼는지로 판단할 수 있다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 보기 — 조회수",
  "summary": "같은 회원은 하루 한 번만 센다. 새로고침해도 숫자가 그대로다. 작성자 본인 조회는 세지 않는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글 보기", "right": "김자바" },
    { "type": "text", "id": "post-title", "value": "주말 등산 사진", "emphasis": "title" },
    { "type": "text", "id": "post-meta", "value": "이스프링 · 10월 10일", "emphasis": "caption", "tone": "muted" },
    { "type": "stats", "id": "counts", "items": [{ "id": "views", "label": "조회", "value": "1" }, { "label": "좋아요", "value": "0" }] },
    { "type": "actions", "id": "nav", "items": [{ "id": "refresh", "label": "새로고침", "variant": "ghost" }] }
  ],
  "flows": [
    {
      "name": "오늘 처음 열기",
      "steps": [
        { "kind": "user", "text": "김자바가 목록에서 이스프링의 글 34를 연다" },
        { "kind": "request", "method": "GET", "path": "/api/posts/34", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "볼 수 있나(2-3) → 작성자 본인인가(아니다) → 오늘 본 기록을 넣어 본다" },
        { "kind": "db", "sql": "INSERT IGNORE INTO post_view (post_id, member_id, viewed_on, created_at)\nVALUES (34, 2, '2026-10-10', NOW());   -- 1행 생김\nUPDATE post SET view_count = view_count + 1 WHERE id = 34;\nSELECT view_count FROM post WHERE id = 34;", "note": "기록이 새로 생겼으니 +1" },
        { "kind": "response", "status": 200, "body": "{\"id\": 34, \"viewCount\": 1, ...}" },
        { "kind": "screen", "text": "조회 1", "focus": ["views"] }
      ]
    },
    {
      "name": "새로고침",
      "steps": [
        { "kind": "user", "text": "같은 화면에서 [새로고침]을 누른다", "focus": ["refresh"] },
        { "kind": "request", "method": "GET", "path": "/api/posts/34", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "db", "sql": "INSERT IGNORE INTO post_view (...) VALUES (34, 2, '2026-10-10', NOW());   -- 0행(이미 있음)", "note": "새로 생긴 행이 없으니 UPDATE를 하지 않는다" },
        { "kind": "response", "status": 200, "body": "{\"id\": 34, \"viewCount\": 1, ...}" },
        { "kind": "screen", "text": "조회수가 그대로 1", "focus": ["views"] }
      ]
    },
    {
      "name": "작성자가 자기 글 열기",
      "steps": [
        { "kind": "user", "text": "이스프링이 자기 글 34를 연다" },
        { "kind": "request", "method": "GET", "path": "/api/posts/34", "headers": ["Authorization: Bearer tok-lee"] },
        { "kind": "server", "text": "보는 사람 = 작성자 → 기록도, +1도 하지 않는다" },
        { "kind": "response", "status": 200, "body": "{\"id\": 34, \"viewCount\": 1, ...}" },
        { "kind": "screen", "text": "조회수 그대로", "focus": ["views"] }
      ]
    }
  ]
}
```

## 만들 것

**V21** — `db/migration/V21__create_post_view.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `post_id` | FK → `post` |
| `member_id` | 본 회원, FK → `member` |
| `viewed_on` | 본 날짜(`DATE`, 서버 시간대 Asia/Seoul 기준) |
| `created_at` | 처음 본 시각 |
| 키 | `PRIMARY KEY (post_id, member_id, viewed_on)` — 같은 회원·글·날짜는 한 행뿐 |

**상세 조회의 조회수 규칙** — `GET /api/posts/{id}`

| 보는 사람 | 조회수 |
|---|---|
| 로그인 회원, 이 글을 **오늘 처음** 봄 | `post_view`에 행을 남기고 `+1` |
| 로그인 회원, 오늘 이미 봄 | 그대로(행도 그대로) |
| 작성자 본인 | 그대로(행을 남기지 않는다) |
| 비로그인 | 누군지 알 수 없어 지금처럼 매번 `+1`(행을 남기지 않는다) |
| 볼 수 없는 글(404) | 그대로(2-3 그대로) |

- 응답의 `viewCount`는 **이번 조회까지 반영된 값**이다(처음 본 사람은 올라간 값을 받는다).
- `+1`은 4-2의 좋아요 수처럼 `UPDATE post SET view_count = view_count + 1`로 DB가 더하게 한다(읽어서 더해 저장하지 않는다 — 이유는 [4-2](../ch4-like/4-2-like-concurrency.md)).
- 다른 응답 필드·상태 코드는 그대로다. 목록 API의 `viewCount`는 DB 값을 그대로 보여 준다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 볼 수 있나(2-3) → 작성자 본인인가(아니다) → 오늘 본 기록을 넣어 본다
- 기록이 새로 생겼으니 +1
- 새로 생긴 행이 없으니 UPDATE를 하지 않는다
- 보는 사람 = 작성자 → 기록도, +1도 하지 않는다

<details>
<summary>Controller / DTO — 조회 응답 연결</summary>

`PostController.getOne`의 매핑과 `PostDetailResponse.viewCount` 필드는 선행 단계 그대로다. 새 규칙은 Service에서 계산하고 기존 DTO에 넣는다.

```java
@GetMapping("/{id}")
public PostDetailResponse getOne(@PathVariable Long id, @LoginMember AuthenticatedMember viewer) {
    return postQueryService.getDetail(id, viewer);
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostQueryService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public PostDetailResponse getDetail(Long id, AuthenticatedMember viewer) {
    Post post = postRepository.findByIdForUpdate(id).orElseThrow(PostNotFoundException::new);
    if (!accessPolicy.canView(viewer, post)) throw new PostNotFoundException();
    if (shouldCountView(viewer, post)) {
        postRepository.incrementViewCount(id);
    }
    int viewCount = postRepository.findViewCountById(id); // 벌크 UPDATE는 관리 엔티티 값을 갱신하지 않는다
    return toDetailResponse(post, viewCount);
}

private boolean shouldCountView(AuthenticatedMember viewer, Post post) {
    if (viewer == null) return true;
    if (viewer.id().equals(post.getAuthor().getId())) return false;
    LocalDateTime now = LocalDateTime.now(clock);
    return postViewRepository.insertIfAbsent(post.getId(), viewer.id(), now.toLocalDate(), now) == 1;
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostRepository.java`, `PostViewRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`PostRepository.findByIdForUpdate`(11-1에서 추가)를 접근 권한 검사와 조회 기록 INSERT 전에 사용한다. 글 행을 먼저 잠그지 않으면, 같은 회원의 동시 첫 조회에서 FK가 잡은 글의 공유 잠금과 조회 기록 PK 잠금이 서로 맞물려 교착이 날 수 있다. 삭제나 공개 범위 변경과 경합해도 잠금 이후의 상태로 404 여부를 결정한다.

```java
@Modifying
@Query(nativeQuery = true, value = "INSERT IGNORE INTO post_view (post_id, member_id, viewed_on, created_at) VALUES (:postId, :memberId, :viewedOn, :now)")
int insertIfAbsent(Long postId, Long memberId, LocalDate viewedOn, LocalDateTime now);

@Modifying
@Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
int incrementViewCount(@Param("id") Long id);

@Query(nativeQuery = true, value = "SELECT view_count FROM post WHERE id = :id FOR UPDATE")
Integer findViewCountById(@Param("id") Long id);
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Post.java`, `PostView.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

```java
@Entity @Table(name = "post_view")
public class PostView {
    @EmbeddedId private Key id;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Embeddable public record Key(Long postId, Long memberId, LocalDate viewedOn)
            implements Serializable {}
}
```

`Post.viewCount`는 누적 값이고, `post_view`는 로그인 회원이 오늘 이미 봤는지 판단하는 기록이다.

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V21__create_post_view.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

```sql
CREATE TABLE post_view (
    post_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    viewed_on DATE NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (post_id, member_id, viewed_on),
    KEY ix_post_view_member (member_id),
    FOREIGN KEY (post_id) REFERENCES post(id),
    FOREIGN KEY (member_id) REFERENCES member(id)
);
```

</details>

<details>
<summary>MyBatis Mapper — 오늘 첫 조회와 카운터</summary>

**MyBatis 대체 코드**는 글 행 잠금, `post_view` 조건부 INSERT, 글의 `view_count` 원자적 증가, 증가 후 조회를 Mapper로 수행한다. 선행 글 조회·권한·DTO는 JPA 경로를 유지하며, SQL은 같은 트랜잭션 안에서 실행된다. 잠금을 먼저 잡아 동시 첫 조회 때 InnoDB의 글 FK 잠금과 조회 기록 PK 잠금이 서로 기다리는 교착을 막는다.

```java
Long lockPost(Long id);
int insertIfAbsent(Long postId, Long memberId, LocalDate viewedOn, LocalDateTime now);
int incrementViewCount(Long id);
Integer findViewCountById(Long id);
```

```xml
<select id="lockPost" resultType="long">
  SELECT id FROM post WHERE id = #{id} FOR UPDATE
</select>
<insert id="insertIfAbsent">
  INSERT IGNORE INTO post_view (post_id, member_id, viewed_on, created_at)
  VALUES (#{postId}, #{memberId}, #{viewedOn}, #{now})
</insert>
<update id="incrementViewCount">
  UPDATE post SET view_count = view_count + 1 WHERE id = #{id}
</update>
<select id="findViewCountById" resultType="int">
  SELECT view_count FROM post WHERE id = #{id} FOR UPDATE
</select>
```

같은 회원의 동시 조회에서 `INSERT IGNORE`의 영향 행 수가 1인 요청만 증가시키므로 DB PK가 중복 조회수를 막는다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글을 만들어 확인하므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {
      "id": "W0",
      "title": "W0 이스프링의 새 글",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-lee" },
      "body": { "boardSlug": "free", "title": "[채점] 조회수 확인", "content": "x" }
    },
    { "id": "W1", "title": "W1 김자바 처음", "method": "GET", "path": "/api/posts/{{W0.body.id}}", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "W2", "title": "W2 김자바 또", "method": "GET", "path": "/api/posts/{{W0.body.id}}", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "W3", "title": "W3 박디비 처음", "method": "GET", "path": "/api/posts/{{W0.body.id}}", "headers": { "Authorization": "Bearer tok-park" } },
    { "id": "W4", "title": "W4 비로그인", "method": "GET", "path": "/api/posts/{{W0.body.id}}" },
    { "id": "W5", "title": "W5 비로그인 또", "method": "GET", "path": "/api/posts/{{W0.body.id}}" },
    { "id": "W6", "title": "W6 작성자 본인", "method": "GET", "path": "/api/posts/{{W0.body.id}}", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "W7", "title": "W7 자유 게시판 첫 글", "method": "GET", "path": "/api/boards/free/posts?size=1" }
  ],
  "checks": [
    { "id": "C1", "request": "W0", "expect": { "status": 201 } },
    { "id": "C2", "request": "W1", "expect": { "status": 200, "json": [{ "path": "$.viewCount", "equals": 1 }] } },
    { "id": "C3", "request": "W2", "expect": { "status": 200, "json": [{ "path": "$.viewCount", "equals": 1 }] } },
    { "id": "C4", "request": "W3", "expect": { "status": 200, "json": [{ "path": "$.viewCount", "equals": 2 }] } },
    {
      "id": "C5",
      "all": [
        { "request": "W4", "expect": { "status": 200, "json": [{ "path": "$.viewCount", "equals": 3 }] } },
        { "request": "W5", "expect": { "status": 200, "json": [{ "path": "$.viewCount", "equals": 4 }] } }
      ]
    },
    { "id": "C6", "request": "W6", "expect": { "status": 200, "json": [{ "path": "$.viewCount", "equals": 4 }] } },
    {
      "id": "C7",
      "request": "W7",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[0].id", "equals": "{{W0.body.id}}" },
          { "path": "$.items[0].viewCount", "equals": 4 }
        ]
      }
    },
    {"id": "C8", "manual": "새 글을 하나 만들고 같은 로그인 토큰으로 GET /api/posts/{id}를 동시에 10번 보낸다. 모두 200이고 DB view_count=1, post_view에는 그 회원·글·오늘 행 1개여야 한다."}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{V}`는 W0에서 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | W0 | `201` |
| C2 | W1(김자바 처음) | `viewCount`=`1` — 이번 조회가 반영된 값 |
| C3 | W2(김자바 또) | `1` |
| C4 | W3(박디비 처음) | `2` |
| C5 | W4 / W5(비로그인 두 번) | `3` / `4` |
| C6 | W6(작성자 본인) | `4` |
| C7 | W7 | 목록 첫 글이 `{V}`, `viewCount`=`4` |
| C8 | 새 글에 같은 회원 토큰으로 동시 GET 10번(직접 확인) | 모두 `200`, DB `view_count=1`, 그 회원·글·오늘의 `post_view` 1행 — 먼저 글 행을 잠가 교착 없이 처리한다 |
| D1 | `SELECT member_id, viewed_on = CURDATE() FROM post_view WHERE post_id = {V} ORDER BY member_id` | `2, 1` / `4, 1` — 두 행뿐(작성자 3·비로그인은 없다) |
| D2 | `SELECT view_count FROM post WHERE id = {V}` | `4` |
| D3 | `SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'community' AND table_name = 'post_view' AND non_unique = 0 AND column_name IN ('post_id', 'member_id', 'viewed_on')` | `3` — `(post_id, member_id, viewed_on)` 세 칸이 PK 또는 UNIQUE 키에 들어 있다(같은 회원·글·날짜를 DB가 한 행으로 막는다) |
| R1 | 처음인지 판단 | "오늘 본 기록이 새로 생겼나"로 판단한다. 코드로 먼저 확인(`exists`)하더라도 PK/UNIQUE가 있어서 같은 행이 두 번 들어가지 않는다 — 판단을 DB 키가 받쳐 준다는 것을 설명할 수 있다 |
| R2 | 올린 뒤의 값 | `UPDATE … SET view_count = view_count + 1`(벌크 UPDATE)은 이미 읽어 둔 엔티티를 바꾸지 않는다. `REPEATABLE READ`의 오래된 읽기 스냅샷도 피하려고 `SELECT view_count ... FOR UPDATE`로 현재 값을 읽는다 |
| R3 | 옛 방식 정리 | 엔티티의 `viewCount + 1`(변경 감지) 경로를 지웠다 — 남겨 두면 한 번 볼 때 2가 오른다 |
| R4 | 날짜 기준 | "오늘"을 `LocalDate.now()`가 아니라 주입받은 `Clock`(8-2)으로 구한다. 서버 시간대가 다르면 날짜 경계가 어긋난다는 것을 안다 |
| R5 | 비로그인 | 비로그인을 매번 세는 한계를 안다. 줄이려면 무엇으로 사람을 구분할지(쿠키에 방문자 id, IP — 회사 하나가 같은 IP를 쓴다)를 말할 수 있다 |

## 필요한 지식

- [4-2. 좋아요 동시성](../ch4-like/4-2-like-concurrency.md) — `UPDATE … = … + 1`을 DB에 맡기는 이유
- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md) — 복합 PK로 "한 번만"을 DB가 지키게
- [S10 Spring Data 쿼리](../../docs/knowledge/S10-spring-data-query.md) — `@Modifying` 벌크 UPDATE와 영속성 컨텍스트
- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md) — 변경 감지

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — "처음 봤나"를 한 문장으로</summary>

MySQL의 `INSERT IGNORE`는 키가 겹치면 에러 대신 아무것도 안 하고 영향받은 행 수 `0`을 돌려준다.

```java
@Modifying
@Query(nativeQuery = true, value = """
        INSERT IGNORE INTO post_view (post_id, member_id, viewed_on, created_at)
        VALUES (:postId, :memberId, :viewedOn, :now)
        """)
int insertIfAbsent(@Param("postId") Long postId, @Param("memberId") Long memberId,
                   @Param("viewedOn") LocalDate viewedOn, @Param("now") LocalDateTime now);
```

`1`이 돌아오면 오늘 처음이다. `existsBy…`로 먼저 보고 없으면 `save`해도 이 단계의 확인은 통과한다 — 그래도 PK는 꼭 건다.
</details>

<details>
<summary>힌트 2 — 조회수 올리고 다시 읽기</summary>

```java
@Modifying
@Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
int incrementViewCount(@Param("id") Long id);

@Query("SELECT p.viewCount FROM Post p WHERE p.id = :id")
Integer findViewCountById(@Param("id") Long id);
```

4-2의 `incrementLikeCount`·`findLikeCountById`와 같은 모양이다. 상세 DTO를 만들 때 `post.getViewCount()` 대신 다시 읽은 값을 넣는다. `post_view`는 저장만 하니 엔티티 없이 네이티브 쿼리로 써도 되지만, `ddl-auto: validate`가 표를 확인하게 하려면 `@EmbeddedId` 엔티티를 두어도 된다.
</details>

## 다음 단계

[11-4. 통합 검색 — 제목·본문·작성자](11-4-search.md)
