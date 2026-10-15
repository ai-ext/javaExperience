# E6. 저장소 메서드 만들기 — 이름으로 쿼리·@Query·페이지

> 개념 레슨 · 40분

## 이게 뭐냐

[E3](E3-what-is-jpa.md)에서 `TagRepository`에 `Optional<Tag> findByName(String name);` 한 줄을 적었더니 `where name = ?` 쿼리가 생겼다. 이번에는 그 규칙을 끝까지 본다. 저장소에 조회 메서드를 만드는 길은 세 가지다.

| 길 | 쓰는 법 | 쿼리는 누가 만드나 | 언제 |
|---|---|---|---|
| ① 물려받은 메서드 | `extends JpaRepository<Post, Long>`만 쓴다 | Spring Data JPA가 이미 갖고 있다 | 번호로 하나 찾기, 전부, 개수, 저장·삭제 |
| ② 이름 규칙(파생 쿼리) | `findByStatus(String status)`처럼 **이름만** 선언 | 메서드 이름을 읽고 만든다 | 조건이 한두 개인 단순 조회 |
| ③ `@Query` | 메서드 위에 쿼리를 직접 적는다 | 내가 쓴다(JPQL 또는 SQL) | 이름이 너무 길어질 때, 이름 규칙으로 못 쓰는 조회 |

### 이름 한 줄을 뜯어 보기

```text
find  Top3  By  Status  OrderBy  ViewCount  Desc
 │     │    │     │        │         │        └ 내림차순
 │     │    │     │        └─────────┴ 정렬 기준 필드
 │     │    │     └ 조건: status = ?
 │     │    └ 여기부터 조건
 │     └ 최대 3개 (limit 3)
 └ 무엇을 할지: find(찾기) · count(세기) · exists(있나) · delete(지우기)
```

- `By` 앞은 **무엇을 할지**, 뒤는 **어떤 행을**이다. `find`와 `By` 사이에 다른 낱말(`findSliceByBoardId`의 `Slice`)을 넣어도 Spring Data는 무시한다. 사람이 읽으라고 붙이는 이름표다(E4의 `WithAuthor`와 같다).
- 조건 이름은 **엔티티의 필드 이름**이다. 열 이름(`view_count`)이 아니라 필드 이름(`viewCount`)을 쓴다. E3에서 오타를 내 봤다.
- 조건 여러 개는 `And`·`Or`로 잇는다. 필드 이름 뒤에 키워드(`Containing`, `Between`, `In`, `IsNull`…)를 붙이면 `=` 대신 다른 비교가 된다.

이름은 **서버가 켜질 때** 한 번 읽힌다. 규칙에 안 맞으면 서버가 아예 안 뜬다. 컴파일은 통과하니 "컴파일 됐으니 됐다"가 통하지 않는다(일부러 틀려 보기).

## 예시

`practice` DB의 `post` 테이블(E4에서 쓴 학습용 DB)을 읽기만 한다. 이번엔 이름 규칙에 집중하려고 게시판·작성자를 객체가 아닌 **번호 필드**로 두었다.

```java
@Entity
@Table(name = "post")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "board_id")
    private Long boardId;          // E4처럼 객체로 이어도 되지만, 이번엔 이름 규칙에 집중하려고 번호로 둔다

    @Column(name = "author_id")
    private Long authorId;

    private String title;
    private String status;         // PUBLISHED · DRAFT · HIDDEN

    @Column(name = "view_count")
    private int viewCount;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;   // 임시저장 글은 null

    protected Post() {}

    public Long getId() { return id; }
    public Long getBoardId() { return boardId; }
    public Long getAuthorId() { return authorId; }
    public String getTitle() { return title; }
    public String getStatus() { return status; }
    public int getViewCount() { return viewCount; }
    public LocalDateTime getPublishedAt() { return publishedAt; }

    @Override
    public String toString() {
        return "#" + id + " " + title;
    }
}
```

```java
// 목록 응답에 필요한 세 칸만 담는 DTO
public record PostSummary(Long id, String title, int viewCount) {}
```

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    // 주어 + By + 조건
    List<Post> findByStatus(String status);
    long countByStatus(String status);
    boolean existsByTitle(String title);

    // 조건 두 개 잇기
    List<Post> findByBoardIdAndStatus(Long boardId, String status);
    List<Post> findByBoardIdOrAuthorId(Long boardId, Long authorId);

    // 조건 키워드
    List<Post> findByTitleContaining(String word);
    List<Post> findByTitleLike(String pattern);
    List<Post> findByPublishedAtBetween(LocalDateTime from, LocalDateTime to);
    List<Post> findByBoardIdIn(Collection<Long> boardIds);
    List<Post> findByPublishedAtIsNull();

    // 정렬 · 개수 제한
    List<Post> findByBoardIdOrderByViewCountDesc(Long boardId);
    List<Post> findTop3ByStatusOrderByViewCountDesc(String status);
    Optional<Post> findFirstByStatusOrderByViewCountDesc(String status);
    Optional<Post> findTopByOrderByViewCountDesc();

    // 한 건만 기대하는 반환 타입
    Optional<Post> findByTitle(String title);

    // 페이지 · 정렬을 호출하는 쪽이 정한다
    Page<Post> findByBoardId(Long boardId, Pageable pageable);
    Slice<Post> findSliceByBoardId(Long boardId, Pageable pageable);
    List<Post> findByStatus(String status, Sort sort);

    // JPQL — 엔티티 이름(Post)과 필드 이름(viewCount)으로 쓴다
    @Query("select p from Post p where p.status = :status and p.viewCount >= :minViews order by p.viewCount desc")
    List<Post> findPopular(@Param("status") String status, @Param("minViews") int minViews);

    // 네이티브 SQL — 테이블 이름(post)과 열 이름(view_count)으로 쓴다
    @Query(value = "select * from post where status = :status and view_count >= :minViews order by view_count desc",
           nativeQuery = true)
    List<Post> findPopularNative(@Param("status") String status, @Param("minViews") int minViews);

    // DTO로 받기 — 필요한 열만 SELECT 한다
    @Query("select new org.example.e6.PostSummary(p.id, p.title, p.viewCount) from Post p where p.boardId = :boardId order by p.viewCount desc")
    List<PostSummary> findSummaries(@Param("boardId") Long boardId);

    List<PostSummary> findSummaryByBoardIdAndStatus(Long boardId, String status);

    Page<PostSummary> findByStatusAndTitleContaining(String status, String word, Pageable pageable);
}
```

import는 `jakarta.persistence.*`, `org.springframework.data.domain.*`(`Page`·`Pageable`·`Slice`·`Sort`), `org.springframework.data.jpa.repository.*`(`JpaRepository`·`Query`), `org.springframework.data.repository.query.Param`, `java.time.LocalDateTime`, `java.util.*`다.

아래 표의 SQL은 전부 따라 해 보기에서 **실제로 나간 것**이다. `Post`를 통째로 읽는 메서드는 SELECT 목록이 늘 `p1_0.id,p1_0.author_id,p1_0.board_id,p1_0.published_at,p1_0.status,p1_0.title,p1_0.view_count`로 같아서 `select …`로 줄였다. `?`에 들어간 값은 `binding parameter` 줄에서 옮겼다.

### ① 물려받은 메서드

| 호출 | 실제 SQL | 돌려준 값 |
|---|---|---|
| `findById(5L)` | `select … from post p1_0 where p1_0.id=?` ← `5` | `Optional[#5 JPA N+1 문제 비교해보기]` |
| `findById(9999L)` | 같은 SQL ← `9999` | `Optional.empty` — 없으면 빈 `Optional`, 예외가 아니다 |
| `count()` | `select count(*) from post p1_0` | `145` (`long`) |
| `existsById(5L)` | `select count(*) from post p1_0 where p1_0.id=?` | `true` (`boolean`) |

`save`·`saveAll`·`findAll`·`delete`·`deleteById`도 같이 물려받는다. 저장·삭제가 내는 SQL은 E7에서 본다.

### ② 이름 규칙 — 메서드마다 나간 SQL

| 메서드(넘긴 값) | 실제 SQL의 뒷부분 | 결과 |
|---|---|---|
| `findByStatus("DRAFT")` | `where p1_0.status=?` | 7개 |
| `countByStatus("HIDDEN")` | `select count(p1_0.id) from post p1_0 where p1_0.status=?` | `4` |
| `existsByTitle("JPA N+1 문제 비교해보기")` | `select p1_0.id from post p1_0 where p1_0.title=? limit ?` ← `1` | `true` |
| `findByBoardIdAndStatus(2L, "PUBLISHED")` | `where p1_0.board_id=? and p1_0.status=?` | 59개 |
| `findByBoardIdOrAuthorId(1L, 4L)` | `where p1_0.board_id=? or p1_0.author_id=?` | 25개 |
| `findByTitleContaining("JPA")` | `where p1_0.title like ? escape '\\'` ← `%JPA%` | 11개 |
| `findByTitleLike("JPA")` | 같은 SQL ← `JPA` | **0개** |
| `findByTitleLike("%JPA%")` | 같은 SQL ← `%JPA%` | 11개 |
| `findByTitleContaining("%")` | 같은 SQL ← `%\%%` | 0개 |
| `findByPublishedAtBetween(7/1 0시, 7/3 23:59:59)` | `where p1_0.published_at between ? and ?` | `#1`~`#8` 중 7개 |
| `findByBoardIdIn(List.of(1L, 2L))` | `where p1_0.board_id in (?,?)` | 68개 |
| `findByPublishedAtIsNull()` | `where p1_0.published_at is null` — `?`가 없다 | 7개 |
| `findByBoardIdOrderByViewCountDesc(4L)` | `where p1_0.board_id=? order by p1_0.view_count desc` | 조회수 순 전부 |
| `findTop3ByStatusOrderByViewCountDesc("PUBLISHED")` | `where p1_0.status=? order by p1_0.view_count desc limit ?` ← `3` | 3개 |
| `findFirstByStatusOrderByViewCountDesc("PUBLISHED")` | 같은 SQL ← `1` | `Optional[#18 …]` |
| `findTopByOrderByViewCountDesc()` | `order by p1_0.view_count desc limit ?` ← `1` | `Optional[#18 …]` |

읽을 것.

- **`count…By`와 `exists…By`도 이름 규칙이다.** `countBy`는 `count(p1_0.id)`, `existsBy`는 id 하나만 `limit 1`로 읽는다. 물려받은 `existsById`는 `count(*)`라서 둘의 SQL이 다르다. 결과(`true`/`false`)는 같다.
- **`Containing`과 `Like`는 SQL이 같고 넘기는 값이 다르다.** `Containing`은 양쪽에 `%`를 붙여 준다. `Like`는 준 값을 그대로 패턴으로 쓴다. `findByTitleLike("JPA")`는 제목이 정확히 `JPA`인 글을 찾으니 0개다.
- **`Containing`은 사용자가 넣은 `%`를 글자로 바꾼다.** `%` 하나로 검색하면 `%\%%`가 들어간다. "`%`라는 글자를 포함한 제목"이라 0개다. `?q=%`만 보내서 전체 글을 긁어 가는 요청을 막아 준다.
- **`Top`·`First`는 같은 뜻이고 숫자가 없으면 1개다.** `limit ?`에 `3`, `1`이 들어간다. 1개만 읽으니 `Optional`로 받을 수 있다.
- `IsNull`처럼 값이 필요 없는 키워드는 매개변수도 없다.

자주 쓰는 키워드를 더 꼽으면 `StartingWith`(뒤에만 `%`), `LessThan`(`<`), `GreaterThanEqual`(`>=`), `IsNotNull`, `IgnoreCase`(대소문자 무시)가 있다. 목록 전체는 더 깊이의 공식 문서 표에 있다.

### 반환 타입 — 몇 개가 올 수 있나

| 반환 타입 | 뜻 | 결과가 0개면 |
|---|---|---|
| `List<Post>` | 여러 개 | 빈 리스트 |
| `Optional<Post>` | **0개 또는 1개** | `Optional.empty` |
| `long` (`countBy`) · `boolean` (`existsBy`) | 개수 · 있나 | `0` · `false` |
| `Page<Post>` | 한 쪽 + 전체 개수·쪽 수 | 빈 쪽 |
| `Slice<Post>` | 한 쪽 + 다음 쪽이 있나 | 빈 쪽 |

`Optional`은 "하나 아니면 없음"이다. **여러 행이 걸리면 예외**다. 제목 `MySQL 인덱스 설계 질문드립니다`는 실습 DB에 3개 있다.

```text
SQL: select … from post p1_0 where p1_0.title=?
[17] org.springframework.dao.IncorrectResultSizeDataAccessException: Query did not return a unique result: 3 results were returned
```

SQL은 정상으로 나갔고, 결과를 `Optional` 하나에 담다가 터졌다. 서버를 켤 때가 아니라 **그 데이터가 들어온 순간** 터진다. 하나만 원하면 `findFirstBy…OrderBy…`로 "1개만"을 이름에 적거나, DB에 `UNIQUE` 제약이 있는 열(이메일, 닉네임)로만 `Optional`을 쓴다.

### 페이지와 정렬 — `Pageable`·`Sort`

"몇 쪽, 몇 개씩, 무슨 순서로"를 메서드 이름에 박지 않고 **호출할 때** 넘기려면 마지막 매개변수를 `Pageable`로 둔다.

```java
Pageable firstPage = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "viewCount"));  // 0쪽(첫 쪽), 3개씩, 조회수 내림차순
Page<Post> page = posts.findByBoardId(2L, firstPage);
Slice<Post> slice = posts.findSliceByBoardId(2L, firstPage);
```

- 쪽 번호는 **0부터**다. 첫 쪽이 `0`이다.
- 정렬 기준은 필드 이름(`"viewCount"`)이다. 열 이름이 아니다.

같은 조건인데 나간 SQL 수가 다르다.

```text
SQL: select … from post p1_0 where p1_0.board_id=? order by p1_0.view_count desc limit ?
bind: (2:INTEGER) <- [3]
SQL: select count(p1_0.id) from post p1_0 where p1_0.board_id=?
[18] Page: [#18 JPA N+1 문제 비교해보기, #145 스프링 트랜잭션 전파 삽질기, #10 Stream API 활용 실전 적용 후기] / 전체 63개, 21쪽, 다음 쪽? true
SQL: select … from post p1_0 where p1_0.board_id=? order by p1_0.view_count desc limit ?
bind: (2:INTEGER) <- [4]
[19] Slice: [#18 JPA N+1 문제 비교해보기, #145 스프링 트랜잭션 전파 삽질기, #10 Stream API 활용 실전 적용 후기] / 다음 쪽? true
```

| | SQL | 아는 것 |
|---|---|---|
| `Page` | 목록(`limit 3`) + **`count` 한 번 더** | 전체 63개, 21쪽 |
| `Slice` | 목록 한 번, 그런데 `limit 4` | 3개를 돌려주고, 4번째가 있었으니 "다음 쪽 있음" |

응답에 전체 쪽 수(`totalPages`)를 넣어야 하면 `Page`, "다음 쪽이 있나"(`hasNext`)만 넣으면 되면 `count`가 없는 `Slice`다. 쪽 번호가 필요 없고 정렬만 바꾸고 싶으면 `Sort`만 받는다. `findByStatus("HIDDEN", Sort.by("title"))` → `where p1_0.status=? order by p1_0.title`.

두 번째 쪽부터는 `limit ?,?`(건너뛸 수, 가져올 수)가 되고, 마지막 쪽에서 `count`를 건너뛰는 경우도 있다. 페이지 계산과 잘못된 `page`·`size` 처리는 G1에서 다룬다.

### 이름이 길어지면 — `@Query`

"공개 글 중 조회수 150 이상, 조회수 순"을 이름으로 쓰면 `findByStatusAndViewCountGreaterThanEqualOrderByViewCountDesc`가 된다. 읽기도 고치기도 힘들다. 이럴 때 쿼리를 직접 적는다.

```java
@Query("select p from Post p where p.status = :status and p.viewCount >= :minViews order by p.viewCount desc")
List<Post> findPopular(@Param("status") String status, @Param("minViews") int minViews);
```

이 글은 SQL이 아니라 **JPQL**이다. 생김새는 SQL과 거의 같은데 대상이 다르다.

| | JPQL (`@Query` 기본) | 네이티브 SQL (`nativeQuery = true`) |
|---|---|---|
| `from` 뒤 | 엔티티 이름 `Post` | 테이블 이름 `post` |
| 조건에 쓰는 이름 | 필드 `p.viewCount` | 열 `view_count` |
| 누가 SQL로 바꾸나 | Hibernate가 번역한다 | 그대로 DB로 간다 |
| 틀리면 | **서버가 안 뜬다** | 서버는 뜨고, **부를 때** 터진다 |

`:status`는 이름 있는 자리다. `@Param("status")`가 붙은 인자 값이 들어간다. 실제로 나간 SQL이다.

```text
[21] JPQL      SQL: select … from post p1_0 where p1_0.status=? and p1_0.view_count>=? order by p1_0.view_count desc
[22] native    SQL: select * from post where status = ? and view_count >= ? order by view_count desc
```

JPQL은 Hibernate가 `p1_0` 별칭을 붙여 다시 썼고, 네이티브는 내가 쓴 글자 그대로다. 둘 다 8개가 나왔다. `:status`가 `?`로 바뀌고 값은 따로 들어가는 것도 같다. 문자열을 이어 붙이지 않으니 SQL 주입 걱정이 없다.

`@Param`을 지워도 이 프로젝트에서는 동작했다. Spring Boot의 Gradle 플러그인이 매개변수 이름을 컴파일 결과에 남기기 때문이다. 그래도 이름과 인자를 눈으로 맞춰 볼 수 있게 붙여 두는 편이 읽기 좋다.

네이티브 SQL은 JPQL로 쓸 수 없는 DB 전용 문법이 꼭 필요할 때 쓴다. 대신 Hibernate가 미리 검사해 주지 않는다.

### DTO(record)로 받기 — 필요한 열만

목록 응답에는 번호·제목·조회수만 있으면 된다. 엔티티 대신 record로 받으면 SELECT 목록도 줄어든다.

```text
[23] select new         SQL: select p1_0.id,p1_0.title,p1_0.view_count from post p1_0 where p1_0.board_id=? order by p1_0.view_count desc
     → [PostSummary[id=134, title=오늘 회고, viewCount=138], PostSummary[id=23, title=좋은 키보드 추천, viewCount=107]]
[24] 이름 규칙 + record  SQL: select p1_0.id,p1_0.title,p1_0.view_count from post p1_0 where p1_0.board_id=? and p1_0.status=?
     → [PostSummary[id=99, title=오늘 회고, viewCount=43]]
```

- JPQL에서는 `select new 패키지.클래스(값, 값, …)`로 생성자를 부른다. 패키지까지 쓴 전체 이름이어야 하고, 인자 순서·타입이 record 선언과 맞아야 한다.
- 이름 규칙 메서드도 반환 타입을 `List<PostSummary>`로 두면 record 생성자 인자 이름(`id`·`title`·`viewCount`)과 같은 필드만 SELECT 했다. `findSummaryByBoardIdAndStatus`의 `Summary`는 사람이 읽는 이름표다.
- 이렇게 받은 record는 엔티티가 아니다. Hibernate가 들고 있지 않으니 E7의 변경 감지(고친 값을 저장해 주는 일)와 상관이 없다. 읽기 전용 목록에 쓴다.

## 따라 해 보기

15분. E4처럼 연습 프로젝트를 하나 만든다. E4 프로젝트에는 이미 `Post` 엔티티가 있으니 새로 만든다.

**1. 프로젝트.** start.spring.io에서 Gradle·Java 21·Spring Boot 4.1.1, 의존성 **Spring Web · Spring Data JPA · MySQL Driver**. 메인 클래스는 `org.example`에, 오늘 파일은 `org.example.e6`에 둔다. `application.yml`은 이렇게 둔다.

```yaml
server:
  port: 18280
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/practice?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
    username: community
    password: community
  jpa:
    hibernate:
      ddl-auto: none        # 테이블은 건드리지 않는다
    open-in-view: false
logging:
  level:
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: trace    # ?에 들어간 값까지 본다
```

**2. 파일.** 예시의 `Post`·`PostSummary`·`PostRepository`와 아래 연습 파일을 만든다.

```java
package org.example.e6;

import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

// 연습용 — 서버가 뜰 때 한 번 실행된다. 다 보고 나면 지운다
@Component
public class E6Playground implements CommandLineRunner {
    private final PostRepository posts;
    public E6Playground(PostRepository posts) { this.posts = posts; }

    private static void p(String s) { System.out.println(s); }

    @Override
    public void run(String... args) {
        // 물려받은 기본 메서드
        p("[A] findById(5): " + posts.findById(5L));
        p("[B] findById(9999): " + posts.findById(9999L));
        p("[C] count(): " + posts.count());
        p("[D] existsById(5): " + posts.existsById(5L));

        // 이름 규칙
        p("[1] findByStatus: " + posts.findByStatus("DRAFT").size() + "개");
        p("[2] countByStatus: " + posts.countByStatus("HIDDEN"));
        p("[3] existsByTitle: " + posts.existsByTitle("JPA N+1 문제 비교해보기"));
        p("[4] findByBoardIdAndStatus: " + posts.findByBoardIdAndStatus(2L, "PUBLISHED").size() + "개");
        p("[5] findByBoardIdOrAuthorId: " + posts.findByBoardIdOrAuthorId(1L, 4L).size() + "개");
        p("[6] findByTitleContaining(JPA): " + posts.findByTitleContaining("JPA").size() + "개");
        p("[7] findByTitleLike(JPA): " + posts.findByTitleLike("JPA").size() + "개");
        p("[8] findByTitleLike(%JPA%): " + posts.findByTitleLike("%JPA%").size() + "개");
        p("[9] findByTitleContaining(%): " + posts.findByTitleContaining("%").size() + "개");
        p("[10] findByPublishedAtBetween: " + posts.findByPublishedAtBetween(
                LocalDateTime.of(2026, 7, 1, 0, 0), LocalDateTime.of(2026, 7, 3, 23, 59, 59)));
        p("[11] findByBoardIdIn: " + posts.findByBoardIdIn(List.of(1L, 2L)).size() + "개");
        p("[12] findByPublishedAtIsNull: " + posts.findByPublishedAtIsNull().size() + "개");
        p("[13] findByBoardIdOrderByViewCountDesc: " + posts.findByBoardIdOrderByViewCountDesc(4L).subList(0, 3));
        p("[14] findTop3ByStatusOrderByViewCountDesc: " + posts.findTop3ByStatusOrderByViewCountDesc("PUBLISHED"));
        p("[15] findFirstByStatusOrderByViewCountDesc: " + posts.findFirstByStatusOrderByViewCountDesc("PUBLISHED"));
        p("[16] findTopByOrderByViewCountDesc: " + posts.findTopByOrderByViewCountDesc());

        // 반환 타입 — Optional인데 여러 행이면?
        try {
            p("[17] findByTitle: " + posts.findByTitle("MySQL 인덱스 설계 질문드립니다"));
        } catch (Exception e) {
            p("[17] " + e);
        }

        // 페이지 · 정렬
        Pageable firstPage = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "viewCount"));
        Page<Post> page = posts.findByBoardId(2L, firstPage);
        p("[18] Page: " + page.getContent() + " / 전체 " + page.getTotalElements() + "개, "
                + page.getTotalPages() + "쪽, 다음 쪽? " + page.hasNext());
        Slice<Post> slice = posts.findSliceByBoardId(2L, firstPage);
        p("[19] Slice: " + slice.getContent() + " / 다음 쪽? " + slice.hasNext());
        p("[20] findByStatus + Sort: " + posts.findByStatus("HIDDEN", Sort.by("title")));

        // @Query · DTO
        p("[21] @Query JPQL: " + posts.findPopular("PUBLISHED", 150).size() + "개");
        p("[22] nativeQuery: " + posts.findPopularNative("PUBLISHED", 150).size() + "개");
        p("[23] select new: " + posts.findSummaries(4L).subList(0, 2));
        p("[24] 이름 규칙 + record: " + posts.findSummaryByBoardIdAndStatus(4L, "HIDDEN"));
    }
}
```

**3. 켜고 `[번호]` 바로 위의 SQL을 읽는다.** 예시의 표와 같은 SQL이 나와야 한다. 개수는 시드 그대로인 DB에서 나온 값이다. 특히 이 다섯 곳을 본다.

| 번호 | 볼 것 |
|---|---|
| [3] | `existsBy`는 `select p1_0.id … limit ?`, [D]의 `existsById`는 `count(*)` |
| [6]~[9] | SQL은 넷 다 `like ? escape '\\'`. 다른 건 `binding parameter` 값(`%JPA%` · `JPA` · `%\%%`) |
| [14]~[16] | `limit ?`에 `3`·`1`·`1` |
| [17] | SQL은 나갔는데 `IncorrectResultSizeDataAccessException` |
| [18]·[19] | `Page`는 SQL 2개(`count` 포함), `Slice`는 1개에 `limit`이 4 |

**4. API로 불러 본다.** 검색어로 공개 글을 찾고 한 쪽씩 돌려주는 컨트롤러다. 엔티티나 `Page`를 그대로 내보내지 않고 응답 record로 옮긴다.

```java
@RestController
public class PostSearchController {

    private final PostRepository posts;

    public PostSearchController(PostRepository posts) {
        this.posts = posts;
    }

    public record SearchResponse(List<PostSummary> items, long totalElements, int totalPages, boolean hasNext) {}

    // GET /e6/posts/search?q=JPA&page=0&size=3 — 공개 글 중 제목 검색, 조회수 많은 순
    @GetMapping("/e6/posts/search")
    public SearchResponse search(@RequestParam String q,
                                 @RequestParam(defaultValue = "0") int page,
                                 @RequestParam(defaultValue = "3") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "viewCount"));
        Page<PostSummary> result = posts.findByStatusAndTitleContaining("PUBLISHED", q, pageable);
        return new SearchResponse(result.getContent(), result.getTotalElements(), result.getTotalPages(), result.hasNext());
    }
}
```

```text
$ curl -s 'localhost:18280/e6/posts/search?q=JPA&page=0&size=3'
{"items":[{"id":18,"title":"JPA N+1 문제 비교해보기","viewCount":242},{"id":71,"title":"JPA N+1 문제 초보 가이드","viewCount":175},{"id":98,"title":"JPA N+1 문제 삽질기","viewCount":117}],"totalElements":10,"totalPages":4,"hasNext":true}
```

서버 로그에는 SQL이 두 줄 나온다. 이름 규칙(`StatusAndTitleContaining`) + record 반환 + `Pageable`이 한 메서드에 다 들어갔다.

```text
SQL: select p1_0.id,p1_0.title,p1_0.view_count from post p1_0 where p1_0.status=? and p1_0.title like ? escape '\\' order by p1_0.view_count desc limit ?
SQL: select count(p1_0.id) from post p1_0 where p1_0.status=? and p1_0.title like ? escape '\\'
```

`page=1`로 다시 부르면 첫 줄 끝이 `limit ?,?`로 바뀌고(`3`, `3` — 3개 건너뛰고 3개) 결과가 `#118`·`#74`·`#69`로 넘어간다.

참고로 이 연습 엔티티는 `deleted_at`(지운 글 표시)을 보지 않아서 지운 글도 검색된다. 지운 글 거르기는 E7과 3-2에서 한다.

**5. `E6Playground.java`를 지운다.** 서버를 켤 때마다 SQL 30개 가까이가 쏟아진다. E7에서 이 프로젝트를 이어 쓴다.

## 일부러 틀려 보기

메시지는 Spring Boot 4.1.1 · Spring Data JPA 4.1.1 · Hibernate 7.4.5에서 재현한 원문이다. 필드 이름 오타(`findByNmae`)는 [E3](E3-what-is-jpa.md#일부러-틀려-보기)에서 봤다.

`PostRepository`는 그대로 두고, 망가뜨리기 전용 저장소를 하나 더 만든다. 아래 메서드를 **한 번에 하나씩** 넣고 서버를 켜 본 뒤 지우고 다음 것을 넣는다. 1~3은 **서버가 안 뜬다.** 맨 아래 `Caused by:`부터 읽는다.

```java
public interface BrokenRepository extends JpaRepository<Post, Long> {
    // 여기에 아래 1~4의 메서드를 하나씩
}
```

**1. 키워드 철자를 틀린다** — `findByTitleContaining` → `findByTitleContain`

```text
Caused by: org.springframework.data.repository.query.QueryCreationException: Cannot create query for method [BrokenRepository.findByTitleContain(java.lang.String)]; No property 'contain' found for type 'String'; Traversed path: Post.title
Caused by: org.springframework.data.core.PropertyReferenceException: No property 'contain' found for type 'String'; Traversed path: Post.title
```

`Contain`을 키워드로 못 알아보니 Spring Data는 "`title` 필드 **안의** `contain` 필드"로 읽었다(`Traversed path: Post.title`). `title`은 `String`이고 `String`에 `contain` 필드는 없다. 키워드는 정해진 철자(`Containing`)만 통한다.

**2. 열 이름을 쓴다** — `List<Post> findByView_count(int v);`

```text
Caused by: org.springframework.data.core.PropertyReferenceException: No property 'view' found for type 'Post'
```

이름 규칙에서 `_`는 "안쪽 필드로 들어가라"는 표시다. `view`를 찾다가 없어서 멈췄다. 필드 이름 `ViewCount`로 쓴다.

**3. JPQL에 오타를 낸다** — `@Query("select p from Post p where p.titel = :title") List<Post> search(@Param("title") String title);`

```text
Caused by: org.springframework.data.repository.query.QueryCreationException: Cannot create query for method [BrokenRepository.search(java.lang.String)]; Query validation failed for 'select p from Post p where p.titel = :title'
…
Caused by: org.hibernate.query.sqm.UnknownPathException: Could not resolve attribute 'titel' of 'org.example.e6.Post' [select p from Post p where p.titel = :title]
```

JPQL은 Hibernate가 서버를 켤 때 엔티티와 맞춰 본다. `Post`에 `titel` 필드가 없으니 기동 실패다. `@Query("select * from post where title = :title")`처럼 **SQL을 JPQL 자리에** 써도 서버가 안 뜬다(`BadJpqlGrammarException: At 1:7 and token '*', extraneous input '*' expecting …`). JPQL에는 `*`가 없고 `select p`처럼 별칭을 쓴다.

**4. 네이티브 SQL에 같은 오타를 낸다** — `@Query(value = "select * from post where titel = :title", nativeQuery = true) List<Post> searchNative(String title);`

서버는 **멀쩡히 뜬다.** 따라 해 보기의 `E6Playground`처럼 `CommandLineRunner`를 잠깐 만들어 `brokenRepository.searchNative("오늘 회고")`를 부르면, 그 순간 DB가 거절한다.

```text
SQL: select * from post where titel = ?
WARN  o.h.orm.jdbc.error : HHH000247: ErrorCode: 1054, SQLState: 42S22
WARN  o.h.orm.jdbc.error : Unknown column 'titel' in 'where clause'
org.springframework.dao.InvalidDataAccessResourceUsageException: JDBC exception executing SQL [Unknown column 'titel' in 'where clause'] [select * from post where titel = ?]; SQL [select * from post where titel = ?]
```

`Unknown column`은 MySQL이 보낸 말이다(`ErrorCode: 1054`). 3과 4의 차이가 `@Query` 기본값을 JPQL로 두는 이유다. 틀린 쿼리를 서버를 켤 때 잡아 준다. 네이티브 쿼리는 테스트나 직접 호출로 한 번은 꼭 실행해 본다.

## 확인 문제

**1.** `List<Post> findTop5ByBoardIdOrderByPublishedAtDesc(Long boardId);`가 만드는 SQL의 `where` 뒤를 써 보라.

<details>
<summary>정답</summary>

`where p1_0.board_id=? order by p1_0.published_at desc limit ?` — `limit`에는 `5`가 들어간다. `Top5`가 개수, `By` 뒤 `BoardId`가 조건, `OrderBy` 뒤 `PublishedAtDesc`가 정렬이다. 필드 이름 `publishedAt`이 열 이름 `published_at`으로 바뀐다.
</details>

**2.** 검색어 `q`로 `JPA`가 오면 `findByTitleLike(q)`는 0개, `findByTitleContaining(q)`는 11개였다. 왜 다른가? `q`로 `%`만 오면 각각 어떻게 되나?

<details>
<summary>정답</summary>

SQL은 둘 다 `title like ?`로 같다. 넘어간 값이 다르다. `Containing`은 `%JPA%`로 감싸서 "포함", `Like`는 `JPA` 그대로라서 "정확히 JPA"다. `%`만 넣으면 `Containing`은 `%\%%`(`%` 글자를 포함)로 바꿔서 0개지만, `Like`는 `%` 그대로 "아무 글자"가 되어 **전부** 나온다. 사용자 입력을 받는 검색에는 `Containing`을 쓴다.
</details>

**3.** 같은 조건, 같은 `PageRequest.of(0, 3, …)`인데 `Page`와 `Slice`는 SQL이 몇 번씩 나갔나? `Slice`의 `limit`은 왜 4인가?

<details>
<summary>정답</summary>

`Page`는 2번(목록 + `select count(…)`), `Slice`는 1번이다. `Slice`는 전체 개수를 세지 않는 대신 한 개를 더(3+1=4) 읽어 본다. 4번째가 있으면 "다음 쪽 있음"으로 답하고 3개만 돌려준다. 응답에 전체 쪽 수가 필요 없고 `hasNext`만 있으면 되는 목록에 쓴다.
</details>

**4.** `Optional<Post> findByTitle(String title)`은 서버를 켤 때 에러가 났나? 언제, 어떤 에러가 났나?

<details>
<summary>정답</summary>

켤 때는 멀쩡했다(이름 규칙은 맞다). **같은 제목 글이 여러 개인 데이터로 부른 순간** `IncorrectResultSizeDataAccessException: Query did not return a unique result: 3 results were returned`가 났다. `Optional`은 0개 또는 1개만 담는다. 여러 개일 수 있으면 `List`로 받거나, 하나만 원하면 `findFirstBy…OrderBy…`로 개수를 이름에 박는다.
</details>

**5.** `@Query`에서 `p.titel`(JPQL)과 `titel`(`nativeQuery = true`)은 각각 언제 에러가 나나? 이 차이 때문에 어느 쪽을 기본으로 쓰나?

<details>
<summary>정답</summary>

JPQL은 **서버를 켤 때** Hibernate가 엔티티와 맞춰 보다가 `UnknownPathException: Could not resolve attribute 'titel'`로 기동을 막는다. 네이티브는 서버는 뜨고 **그 메서드를 부를 때** MySQL이 `Unknown column 'titel'`로 거절한다. 실수를 일찍 잡아 주는 JPQL(`@Query` 기본값)을 먼저 쓰고, DB 전용 문법이 꼭 필요할 때만 네이티브를 쓴다.
</details>

## 더 깊이

- [S10 — 리포지토리 메서드는 SQL로 바로 치환되지 않는다](../docs/knowledge/S10-spring-data-query.md#리포지토리-메서드는-sql로-바로-치환되지-않는다) — 이름 해석, `@Query`, projection
- [S10 — 페이징은 정렬과 건수 계산의 계약이다](../docs/knowledge/S10-spring-data-query.md#페이징은-정렬과-건수-계산의-계약이다) · [W15 페이징 — OFFSET vs 커서](../docs/knowledge/W15-paging-offset-vs-cursor.md)
- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — 엔티티·`Page`를 그대로 응답하지 않는 이유
- 원문: [Spring Data JPA — JPA Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html) — 키워드 전체 표·`@Query`·네이티브 쿼리 · [Defining Query Methods](https://docs.spring.io/spring-data/commons/reference/repositories/query-methods-details.html) — 이름 해석 규칙·`Top`/`First`·반환 타입·`Page`/`Slice` · [Projections](https://docs.spring.io/spring-data/commons/reference/repositories/projections.html) — 인터페이스·record로 받기 · [`JpaRepository` API](https://docs.spring.io/spring-data/jpa/reference/api/java/org/springframework/data/jpa/repository/JpaRepository.html) · [`PageRequest` API](https://docs.spring.io/spring-data/commons/reference/api/java/org/springframework/data/domain/PageRequest.html)

## 다음

- 레슨: [E7. JPA로 수정·삭제하기](E7-jpa-update-delete.md) — 같은 프로젝트에서 고치고 지운다.
- 실습: [2-1. 단건 조회와 404](../scenario/ch2-read-post/2-1-get-one.md) — `findById`와 `Optional`로 없는 글을 404로.
- 실습: [2-2. 게시판 목록과 페이징](../scenario/ch2-read-post/2-2-board-list.md) — 오늘의 `Pageable`·`Page`를 목록 API로. 레슨 [G1](G1-paging-and-sorting.md)을 먼저 보면 좋다.
