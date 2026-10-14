# L13. 확장 @Query·JOIN·집계

> 최종 본편 16-4 · practice DB에서 연속 실행

## 상황과 개념

L12와 같은 게시글 id를 이어 사용합니다. JPQL은 Post/p.board 같은 Java 이름, SQL은 post/board_id 같은 DB 이름을 씁니다. 선택 조건은 바인딩하고 임의 입력을 SQL에 이어 붙이지 않습니다. [Spring Data @Query](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html) · [MyBatis 동적 SQL](https://mybatis.org/mybatis-3/dynamic-sql.html).

## 실행 준비

저장소 루트에서 `python3 tools/materialize-query-practice.py --output /tmp/query-practice --through l13-declared-queries`를 실행합니다. 처음 L12를 적용할 때 출력 디렉터리는 비어 있어야 합니다. 이후 L13·L14에서 같은 경로로 명령을 다시 실행하면 다음 overlay만 적용됩니다. Java 21로 복원 폴더에서 `./gradlew bootRun --args="--spring.profiles.active=practice"`를 실행합니다. DB 접속은 SPRING_DATASOURCE_URL/SPRING_DATASOURCE_USERNAME/SPRING_DATASOURCE_PASSWORD 환경변수로 조정합니다. L13은 L12 위에, L14는 L12와 L13 위에 적용됩니다.

기존 POST /api/posts에 작성자 토큰과 `{"boardSlug":"dev","title":"쿼리 연습 JPA","content":"본문","tags":["spring"],"visibility":"PUBLIC"}`를 보내 201 응답의 id를 받으세요. 같은 DB에서 이 id를 아래 {id}로 사용합니다. 새 API는 공개 데이터 비교용이며 개인별 권한은 기존 API에서 확인합니다.

## 순서대로 구현할 시나리오

### Q09. DTO projection

- 요청: `GET /api/query-practice/jpa/search`
- 조건: id/title/boardSlug/authorId
- JPA @Query: `select new QueryPostRow`
- MyBatis/SQL: `SELECT 네 열`
- 기대: DTO items
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q09 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · DeclaredQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class DeclaredQueryController {
    private final DeclaredQueryService service;
    public DeclaredQueryController(DeclaredQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.search(engine, params);
    }
    @GetMapping("/board-counts")
    public List<BoardCountRow> boardCounts(@PathVariable String engine) { return service.boardCounts(engine); }
}
```

**Service · DeclaredQueryService.java**

```java
package org.example.querypractice;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DeclaredQueryService {
    private final DeclaredPostRepository repository;
    private final DeclaredPostMapper mapper;
    public DeclaredQueryService(DeclaredPostRepository repository, DeclaredPostMapper mapper) {
        this.repository = repository; this.mapper = mapper;
    }
    public QueryPage search(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        SearchFilter filter = SearchFilter.parse(params);
        if (engine.equals("mybatis")) return new QueryPage(mapper.search(filter), filter.page(), filter.size(), mapper.count(filter));
        var page = repository.search(filter, filter.pageable());
        return new QueryPage(page.getContent(), filter.page(), filter.size(), page.getTotalElements());
    }
    public List<BoardCountRow> boardCounts(String engine) {
        QueryInputs.engine(engine);
        return engine.equals("jpa") ? repository.boardCounts() : mapper.boardCounts();
    }
}
```

**DTO · SearchFilter.java**

```java
package org.example.querypractice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public record SearchFilter(String boardSlug, Long authorId, String pattern, String tag,
                           LocalDateTime from, LocalDateTime to, int page, int size, String sort) {
    public static SearchFilter parse(Map<String, String> params) {
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        String tag = QueryInputs.text(params, "tag", 30);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        LocalDateTime from = date(params.get("from"), "from");
        LocalDateTime to = date(params.get("to"), "to");
        if (from != null && to != null && !from.isBefore(to)) throw QueryInputs.bad("from/to");
        String sort = params.getOrDefault("sort", "latest");
        if (!sort.equals("latest") && !sort.equals("likes")) throw QueryInputs.bad("sort");
        return new SearchFilter(board, author, QueryInputs.pattern(keyword), tag, from, to,
                QueryInputs.number(params, "page", 0, 0, 10000), QueryInputs.number(params, "size", 10, 1, 50), sort);
    }
    private static LocalDateTime date(String value, String field) {
        if (value == null) return null;
        try { return LocalDateTime.parse(value); }
        catch (DateTimeParseException e) { throw QueryInputs.bad(field); }
    }
    public long offset() { return (long) page * size; }
    public PageRequest pageable() {
        Sort order = Sort.by(Sort.Direction.DESC, "id");
        if (sort.equals("likes")) order = Sort.by(Sort.Direction.DESC, "likeCount").and(order);
        return PageRequest.of(page, size, order);
    }
}
```

**DTO · QueryPostRow.java**

```java
package org.example.querypractice;

import org.example.post.Post;

// 엔티티 전체를 JSON으로 노출하지 않고 이번 화면에 필요한 열만 반환한다.
public record QueryPostRow(Long id, String title, String boardSlug, Long authorId) {
    public static QueryPostRow of(Post post) {
        return new QueryPostRow(post.getId(), post.getTitle(), post.getBoard().getSlug(), post.getAuthor().getId());
    }
}
```

**JPA Repository · DeclaredPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeclaredPostRepository extends Repository<Post, Long> {
    String FILTER = """
        from Post p join p.board b join p.author a
        where p.deletedAt is null and p.hiddenAt is null and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
          and (:#{#f.boardSlug()} is null or b.slug = :#{#f.boardSlug()})
          and (:#{#f.authorId()} is null or a.id = :#{#f.authorId()})
          and (:#{#f.pattern()} is null or (lower(p.title) like lower(:#{#f.pattern()}) escape '!'
                                            or lower(p.content) like lower(:#{#f.pattern()}) escape '!'))
          and (:#{#f.tag()} is null or exists (select t.id from Post other join other.tags t where other.id = p.id and t.name = :#{#f.tag()}))
          and (:#{#f.from()} is null or p.createdAt >= :#{#f.from()})
          and (:#{#f.to()} is null or p.createdAt < :#{#f.to()})
        """;

    // JPQL은 post/board_id 같은 SQL 이름이 아니라 Post/board 같은 Java 이름을 쓴다.
    @Query(value = "select new org.example.querypractice.QueryPostRow(p.id, p.title, b.slug, a.id) " + FILTER,
           countQuery = "select count(p.id) " + FILTER)
    Page<QueryPostRow> search(@Param("f") SearchFilter filter, Pageable pageable);

    // 공개 글이 없는 게시판도 0으로 반환하려고 노출 조건을 WHERE 대신 ON에 둔다.
    @Query("""
        select new org.example.querypractice.BoardCountRow(b.slug, count(p.id))
        from Board b left join Post p on p.board = b and p.deletedAt is null and p.hiddenAt is null
             and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
        group by b.slug order by b.slug
        """)
    List<BoardCountRow> boardCounts();
}
```

**MyBatis Mapper/XML · DeclaredPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.DeclaredPostMapper">
    <sql id="filters">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        <if test="f.boardSlug != null">AND b.slug = #{f.boardSlug}</if>
        <if test="f.authorId != null">AND p.author_id = #{f.authorId}</if>
        <if test="f.pattern != null">AND (LOWER(p.title) LIKE LOWER(#{f.pattern}) ESCAPE '!' OR LOWER(p.content) LIKE LOWER(#{f.pattern}) ESCAPE '!')</if>
        <if test="f.tag != null">AND EXISTS (SELECT 1 FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name = #{f.tag})</if>
        <if test="f.from != null">AND p.created_at &gt;= #{f.from}</if>
        <if test="f.to != null">AND p.created_at &lt; #{f.to}</if>
    </sql>
    <select id="search" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="filters"/>
        <choose><when test="f.sort == 'likes'">ORDER BY p.like_count DESC, p.id DESC</when><otherwise>ORDER BY p.id DESC</otherwise></choose>
        LIMIT #{f.size} OFFSET #{f.offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id WHERE <include refid="filters"/>
    </select>
    <select id="boardCounts" resultType="org.example.querypractice.BoardCountRow">
        SELECT b.slug AS board_slug, COUNT(p.id) AS post_count FROM board b
        LEFT JOIN post p ON p.board_id = b.id AND p.deleted_at IS NULL AND p.hidden_at IS NULL
                        AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        GROUP BY b.slug ORDER BY b.slug
    </select>
</mapper>
```

</details>


### Q10. 게시판·작성자

- 요청: `GET /api/query-practice/mybatis/search?boardSlug=dev&authorId=5`
- 조건: 두 조건 AND
- JPA @Query: `@Query JOIN`
- MyBatis/SQL: `JOIN board AND author_id=?`
- 기대: 교집합
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q10 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · DeclaredQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class DeclaredQueryController {
    private final DeclaredQueryService service;
    public DeclaredQueryController(DeclaredQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.search(engine, params);
    }
    @GetMapping("/board-counts")
    public List<BoardCountRow> boardCounts(@PathVariable String engine) { return service.boardCounts(engine); }
}
```

**Service · DeclaredQueryService.java**

```java
package org.example.querypractice;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DeclaredQueryService {
    private final DeclaredPostRepository repository;
    private final DeclaredPostMapper mapper;
    public DeclaredQueryService(DeclaredPostRepository repository, DeclaredPostMapper mapper) {
        this.repository = repository; this.mapper = mapper;
    }
    public QueryPage search(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        SearchFilter filter = SearchFilter.parse(params);
        if (engine.equals("mybatis")) return new QueryPage(mapper.search(filter), filter.page(), filter.size(), mapper.count(filter));
        var page = repository.search(filter, filter.pageable());
        return new QueryPage(page.getContent(), filter.page(), filter.size(), page.getTotalElements());
    }
    public List<BoardCountRow> boardCounts(String engine) {
        QueryInputs.engine(engine);
        return engine.equals("jpa") ? repository.boardCounts() : mapper.boardCounts();
    }
}
```

**DTO · SearchFilter.java**

```java
package org.example.querypractice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public record SearchFilter(String boardSlug, Long authorId, String pattern, String tag,
                           LocalDateTime from, LocalDateTime to, int page, int size, String sort) {
    public static SearchFilter parse(Map<String, String> params) {
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        String tag = QueryInputs.text(params, "tag", 30);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        LocalDateTime from = date(params.get("from"), "from");
        LocalDateTime to = date(params.get("to"), "to");
        if (from != null && to != null && !from.isBefore(to)) throw QueryInputs.bad("from/to");
        String sort = params.getOrDefault("sort", "latest");
        if (!sort.equals("latest") && !sort.equals("likes")) throw QueryInputs.bad("sort");
        return new SearchFilter(board, author, QueryInputs.pattern(keyword), tag, from, to,
                QueryInputs.number(params, "page", 0, 0, 10000), QueryInputs.number(params, "size", 10, 1, 50), sort);
    }
    private static LocalDateTime date(String value, String field) {
        if (value == null) return null;
        try { return LocalDateTime.parse(value); }
        catch (DateTimeParseException e) { throw QueryInputs.bad(field); }
    }
    public long offset() { return (long) page * size; }
    public PageRequest pageable() {
        Sort order = Sort.by(Sort.Direction.DESC, "id");
        if (sort.equals("likes")) order = Sort.by(Sort.Direction.DESC, "likeCount").and(order);
        return PageRequest.of(page, size, order);
    }
}
```

**DTO · QueryPostRow.java**

```java
package org.example.querypractice;

import org.example.post.Post;

// 엔티티 전체를 JSON으로 노출하지 않고 이번 화면에 필요한 열만 반환한다.
public record QueryPostRow(Long id, String title, String boardSlug, Long authorId) {
    public static QueryPostRow of(Post post) {
        return new QueryPostRow(post.getId(), post.getTitle(), post.getBoard().getSlug(), post.getAuthor().getId());
    }
}
```

**JPA Repository · DeclaredPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeclaredPostRepository extends Repository<Post, Long> {
    String FILTER = """
        from Post p join p.board b join p.author a
        where p.deletedAt is null and p.hiddenAt is null and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
          and (:#{#f.boardSlug()} is null or b.slug = :#{#f.boardSlug()})
          and (:#{#f.authorId()} is null or a.id = :#{#f.authorId()})
          and (:#{#f.pattern()} is null or (lower(p.title) like lower(:#{#f.pattern()}) escape '!'
                                            or lower(p.content) like lower(:#{#f.pattern()}) escape '!'))
          and (:#{#f.tag()} is null or exists (select t.id from Post other join other.tags t where other.id = p.id and t.name = :#{#f.tag()}))
          and (:#{#f.from()} is null or p.createdAt >= :#{#f.from()})
          and (:#{#f.to()} is null or p.createdAt < :#{#f.to()})
        """;

    // JPQL은 post/board_id 같은 SQL 이름이 아니라 Post/board 같은 Java 이름을 쓴다.
    @Query(value = "select new org.example.querypractice.QueryPostRow(p.id, p.title, b.slug, a.id) " + FILTER,
           countQuery = "select count(p.id) " + FILTER)
    Page<QueryPostRow> search(@Param("f") SearchFilter filter, Pageable pageable);

    // 공개 글이 없는 게시판도 0으로 반환하려고 노출 조건을 WHERE 대신 ON에 둔다.
    @Query("""
        select new org.example.querypractice.BoardCountRow(b.slug, count(p.id))
        from Board b left join Post p on p.board = b and p.deletedAt is null and p.hiddenAt is null
             and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
        group by b.slug order by b.slug
        """)
    List<BoardCountRow> boardCounts();
}
```

**MyBatis Mapper/XML · DeclaredPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.DeclaredPostMapper">
    <sql id="filters">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        <if test="f.boardSlug != null">AND b.slug = #{f.boardSlug}</if>
        <if test="f.authorId != null">AND p.author_id = #{f.authorId}</if>
        <if test="f.pattern != null">AND (LOWER(p.title) LIKE LOWER(#{f.pattern}) ESCAPE '!' OR LOWER(p.content) LIKE LOWER(#{f.pattern}) ESCAPE '!')</if>
        <if test="f.tag != null">AND EXISTS (SELECT 1 FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name = #{f.tag})</if>
        <if test="f.from != null">AND p.created_at &gt;= #{f.from}</if>
        <if test="f.to != null">AND p.created_at &lt; #{f.to}</if>
    </sql>
    <select id="search" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="filters"/>
        <choose><when test="f.sort == 'likes'">ORDER BY p.like_count DESC, p.id DESC</when><otherwise>ORDER BY p.id DESC</otherwise></choose>
        LIMIT #{f.size} OFFSET #{f.offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id WHERE <include refid="filters"/>
    </select>
    <select id="boardCounts" resultType="org.example.querypractice.BoardCountRow">
        SELECT b.slug AS board_slug, COUNT(p.id) AS post_count FROM board b
        LEFT JOIN post p ON p.board_id = b.id AND p.deleted_at IS NULL AND p.hidden_at IS NULL
                        AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        GROUP BY b.slug ORDER BY b.slug
    </select>
</mapper>
```

</details>


### Q11. 태그 관계

- 요청: `GET /api/query-practice/jpa/search?tag=spring`
- 조건: 태그 존재
- JPA @Query: `exists join tags`
- MyBatis/SQL: `EXISTS(post_tag JOIN tag)`
- 기대: 중복 없는 글
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q11 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · DeclaredQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class DeclaredQueryController {
    private final DeclaredQueryService service;
    public DeclaredQueryController(DeclaredQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.search(engine, params);
    }
    @GetMapping("/board-counts")
    public List<BoardCountRow> boardCounts(@PathVariable String engine) { return service.boardCounts(engine); }
}
```

**Service · DeclaredQueryService.java**

```java
package org.example.querypractice;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DeclaredQueryService {
    private final DeclaredPostRepository repository;
    private final DeclaredPostMapper mapper;
    public DeclaredQueryService(DeclaredPostRepository repository, DeclaredPostMapper mapper) {
        this.repository = repository; this.mapper = mapper;
    }
    public QueryPage search(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        SearchFilter filter = SearchFilter.parse(params);
        if (engine.equals("mybatis")) return new QueryPage(mapper.search(filter), filter.page(), filter.size(), mapper.count(filter));
        var page = repository.search(filter, filter.pageable());
        return new QueryPage(page.getContent(), filter.page(), filter.size(), page.getTotalElements());
    }
    public List<BoardCountRow> boardCounts(String engine) {
        QueryInputs.engine(engine);
        return engine.equals("jpa") ? repository.boardCounts() : mapper.boardCounts();
    }
}
```

**DTO · SearchFilter.java**

```java
package org.example.querypractice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public record SearchFilter(String boardSlug, Long authorId, String pattern, String tag,
                           LocalDateTime from, LocalDateTime to, int page, int size, String sort) {
    public static SearchFilter parse(Map<String, String> params) {
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        String tag = QueryInputs.text(params, "tag", 30);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        LocalDateTime from = date(params.get("from"), "from");
        LocalDateTime to = date(params.get("to"), "to");
        if (from != null && to != null && !from.isBefore(to)) throw QueryInputs.bad("from/to");
        String sort = params.getOrDefault("sort", "latest");
        if (!sort.equals("latest") && !sort.equals("likes")) throw QueryInputs.bad("sort");
        return new SearchFilter(board, author, QueryInputs.pattern(keyword), tag, from, to,
                QueryInputs.number(params, "page", 0, 0, 10000), QueryInputs.number(params, "size", 10, 1, 50), sort);
    }
    private static LocalDateTime date(String value, String field) {
        if (value == null) return null;
        try { return LocalDateTime.parse(value); }
        catch (DateTimeParseException e) { throw QueryInputs.bad(field); }
    }
    public long offset() { return (long) page * size; }
    public PageRequest pageable() {
        Sort order = Sort.by(Sort.Direction.DESC, "id");
        if (sort.equals("likes")) order = Sort.by(Sort.Direction.DESC, "likeCount").and(order);
        return PageRequest.of(page, size, order);
    }
}
```

**DTO · QueryPostRow.java**

```java
package org.example.querypractice;

import org.example.post.Post;

// 엔티티 전체를 JSON으로 노출하지 않고 이번 화면에 필요한 열만 반환한다.
public record QueryPostRow(Long id, String title, String boardSlug, Long authorId) {
    public static QueryPostRow of(Post post) {
        return new QueryPostRow(post.getId(), post.getTitle(), post.getBoard().getSlug(), post.getAuthor().getId());
    }
}
```

**JPA Repository · DeclaredPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeclaredPostRepository extends Repository<Post, Long> {
    String FILTER = """
        from Post p join p.board b join p.author a
        where p.deletedAt is null and p.hiddenAt is null and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
          and (:#{#f.boardSlug()} is null or b.slug = :#{#f.boardSlug()})
          and (:#{#f.authorId()} is null or a.id = :#{#f.authorId()})
          and (:#{#f.pattern()} is null or (lower(p.title) like lower(:#{#f.pattern()}) escape '!'
                                            or lower(p.content) like lower(:#{#f.pattern()}) escape '!'))
          and (:#{#f.tag()} is null or exists (select t.id from Post other join other.tags t where other.id = p.id and t.name = :#{#f.tag()}))
          and (:#{#f.from()} is null or p.createdAt >= :#{#f.from()})
          and (:#{#f.to()} is null or p.createdAt < :#{#f.to()})
        """;

    // JPQL은 post/board_id 같은 SQL 이름이 아니라 Post/board 같은 Java 이름을 쓴다.
    @Query(value = "select new org.example.querypractice.QueryPostRow(p.id, p.title, b.slug, a.id) " + FILTER,
           countQuery = "select count(p.id) " + FILTER)
    Page<QueryPostRow> search(@Param("f") SearchFilter filter, Pageable pageable);

    // 공개 글이 없는 게시판도 0으로 반환하려고 노출 조건을 WHERE 대신 ON에 둔다.
    @Query("""
        select new org.example.querypractice.BoardCountRow(b.slug, count(p.id))
        from Board b left join Post p on p.board = b and p.deletedAt is null and p.hiddenAt is null
             and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
        group by b.slug order by b.slug
        """)
    List<BoardCountRow> boardCounts();
}
```

**MyBatis Mapper/XML · DeclaredPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.DeclaredPostMapper">
    <sql id="filters">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        <if test="f.boardSlug != null">AND b.slug = #{f.boardSlug}</if>
        <if test="f.authorId != null">AND p.author_id = #{f.authorId}</if>
        <if test="f.pattern != null">AND (LOWER(p.title) LIKE LOWER(#{f.pattern}) ESCAPE '!' OR LOWER(p.content) LIKE LOWER(#{f.pattern}) ESCAPE '!')</if>
        <if test="f.tag != null">AND EXISTS (SELECT 1 FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name = #{f.tag})</if>
        <if test="f.from != null">AND p.created_at &gt;= #{f.from}</if>
        <if test="f.to != null">AND p.created_at &lt; #{f.to}</if>
    </sql>
    <select id="search" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="filters"/>
        <choose><when test="f.sort == 'likes'">ORDER BY p.like_count DESC, p.id DESC</when><otherwise>ORDER BY p.id DESC</otherwise></choose>
        LIMIT #{f.size} OFFSET #{f.offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id WHERE <include refid="filters"/>
    </select>
    <select id="boardCounts" resultType="org.example.querypractice.BoardCountRow">
        SELECT b.slug AS board_slug, COUNT(p.id) AS post_count FROM board b
        LEFT JOIN post p ON p.board_id = b.id AND p.deleted_at IS NULL AND p.hidden_at IS NULL
                        AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        GROUP BY b.slug ORDER BY b.slug
    </select>
</mapper>
```

</details>


### Q12. 빈 게시판 집계

- 요청: `GET /api/query-practice/mybatis/board-counts`
- 조건: 모든 게시판의 공개 글 수
- JPA @Query: `LEFT JOIN ON 공개조건`
- MyBatis/SQL: `COUNT(p.id) GROUP BY`
- 기대: 0 포함
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q12 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · DeclaredQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class DeclaredQueryController {
    private final DeclaredQueryService service;
    public DeclaredQueryController(DeclaredQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.search(engine, params);
    }
    @GetMapping("/board-counts")
    public List<BoardCountRow> boardCounts(@PathVariable String engine) { return service.boardCounts(engine); }
}
```

**Service · DeclaredQueryService.java**

```java
package org.example.querypractice;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DeclaredQueryService {
    private final DeclaredPostRepository repository;
    private final DeclaredPostMapper mapper;
    public DeclaredQueryService(DeclaredPostRepository repository, DeclaredPostMapper mapper) {
        this.repository = repository; this.mapper = mapper;
    }
    public QueryPage search(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        SearchFilter filter = SearchFilter.parse(params);
        if (engine.equals("mybatis")) return new QueryPage(mapper.search(filter), filter.page(), filter.size(), mapper.count(filter));
        var page = repository.search(filter, filter.pageable());
        return new QueryPage(page.getContent(), filter.page(), filter.size(), page.getTotalElements());
    }
    public List<BoardCountRow> boardCounts(String engine) {
        QueryInputs.engine(engine);
        return engine.equals("jpa") ? repository.boardCounts() : mapper.boardCounts();
    }
}
```

**DTO · SearchFilter.java**

```java
package org.example.querypractice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public record SearchFilter(String boardSlug, Long authorId, String pattern, String tag,
                           LocalDateTime from, LocalDateTime to, int page, int size, String sort) {
    public static SearchFilter parse(Map<String, String> params) {
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        String tag = QueryInputs.text(params, "tag", 30);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        LocalDateTime from = date(params.get("from"), "from");
        LocalDateTime to = date(params.get("to"), "to");
        if (from != null && to != null && !from.isBefore(to)) throw QueryInputs.bad("from/to");
        String sort = params.getOrDefault("sort", "latest");
        if (!sort.equals("latest") && !sort.equals("likes")) throw QueryInputs.bad("sort");
        return new SearchFilter(board, author, QueryInputs.pattern(keyword), tag, from, to,
                QueryInputs.number(params, "page", 0, 0, 10000), QueryInputs.number(params, "size", 10, 1, 50), sort);
    }
    private static LocalDateTime date(String value, String field) {
        if (value == null) return null;
        try { return LocalDateTime.parse(value); }
        catch (DateTimeParseException e) { throw QueryInputs.bad(field); }
    }
    public long offset() { return (long) page * size; }
    public PageRequest pageable() {
        Sort order = Sort.by(Sort.Direction.DESC, "id");
        if (sort.equals("likes")) order = Sort.by(Sort.Direction.DESC, "likeCount").and(order);
        return PageRequest.of(page, size, order);
    }
}
```

**DTO · QueryPostRow.java**

```java
package org.example.querypractice;

import org.example.post.Post;

// 엔티티 전체를 JSON으로 노출하지 않고 이번 화면에 필요한 열만 반환한다.
public record QueryPostRow(Long id, String title, String boardSlug, Long authorId) {
    public static QueryPostRow of(Post post) {
        return new QueryPostRow(post.getId(), post.getTitle(), post.getBoard().getSlug(), post.getAuthor().getId());
    }
}
```

**JPA Repository · DeclaredPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeclaredPostRepository extends Repository<Post, Long> {
    String FILTER = """
        from Post p join p.board b join p.author a
        where p.deletedAt is null and p.hiddenAt is null and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
          and (:#{#f.boardSlug()} is null or b.slug = :#{#f.boardSlug()})
          and (:#{#f.authorId()} is null or a.id = :#{#f.authorId()})
          and (:#{#f.pattern()} is null or (lower(p.title) like lower(:#{#f.pattern()}) escape '!'
                                            or lower(p.content) like lower(:#{#f.pattern()}) escape '!'))
          and (:#{#f.tag()} is null or exists (select t.id from Post other join other.tags t where other.id = p.id and t.name = :#{#f.tag()}))
          and (:#{#f.from()} is null or p.createdAt >= :#{#f.from()})
          and (:#{#f.to()} is null or p.createdAt < :#{#f.to()})
        """;

    // JPQL은 post/board_id 같은 SQL 이름이 아니라 Post/board 같은 Java 이름을 쓴다.
    @Query(value = "select new org.example.querypractice.QueryPostRow(p.id, p.title, b.slug, a.id) " + FILTER,
           countQuery = "select count(p.id) " + FILTER)
    Page<QueryPostRow> search(@Param("f") SearchFilter filter, Pageable pageable);

    // 공개 글이 없는 게시판도 0으로 반환하려고 노출 조건을 WHERE 대신 ON에 둔다.
    @Query("""
        select new org.example.querypractice.BoardCountRow(b.slug, count(p.id))
        from Board b left join Post p on p.board = b and p.deletedAt is null and p.hiddenAt is null
             and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
        group by b.slug order by b.slug
        """)
    List<BoardCountRow> boardCounts();
}
```

**MyBatis Mapper/XML · DeclaredPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.DeclaredPostMapper">
    <sql id="filters">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        <if test="f.boardSlug != null">AND b.slug = #{f.boardSlug}</if>
        <if test="f.authorId != null">AND p.author_id = #{f.authorId}</if>
        <if test="f.pattern != null">AND (LOWER(p.title) LIKE LOWER(#{f.pattern}) ESCAPE '!' OR LOWER(p.content) LIKE LOWER(#{f.pattern}) ESCAPE '!')</if>
        <if test="f.tag != null">AND EXISTS (SELECT 1 FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name = #{f.tag})</if>
        <if test="f.from != null">AND p.created_at &gt;= #{f.from}</if>
        <if test="f.to != null">AND p.created_at &lt; #{f.to}</if>
    </sql>
    <select id="search" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="filters"/>
        <choose><when test="f.sort == 'likes'">ORDER BY p.like_count DESC, p.id DESC</when><otherwise>ORDER BY p.id DESC</otherwise></choose>
        LIMIT #{f.size} OFFSET #{f.offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id WHERE <include refid="filters"/>
    </select>
    <select id="boardCounts" resultType="org.example.querypractice.BoardCountRow">
        SELECT b.slug AS board_slug, COUNT(p.id) AS post_count FROM board b
        LEFT JOIN post p ON p.board_id = b.id AND p.deleted_at IS NULL AND p.hidden_at IS NULL
                        AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        GROUP BY b.slug ORDER BY b.slug
    </select>
</mapper>
```

</details>


practice 실습 DB에 글이 없는 게시판을 하나 만든 뒤 0건을 확인하세요. 실제 운영 DB에는 실행하지 않습니다.

```sql
INSERT INTO board (slug, name, write_role, sort_order, created_at)
VALUES ('query-empty-practice', '쿼리 빈 게시판', 'USER', 999, CURRENT_TIMESTAMP);

SELECT b.slug, COUNT(p.id) AS post_count
FROM board b
LEFT JOIN post p ON p.board_id = b.id
  AND p.deleted_at IS NULL AND p.hidden_at IS NULL
  AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
WHERE b.slug = 'query-empty-practice'
GROUP BY b.slug;
-- 기대: query-empty-practice | 0
```

실습을 마쳤으면 `DELETE FROM board WHERE slug = 'query-empty-practice';`로 본인이 만든 행만 정리합니다.

### Q13. 제목 또는 본문·기간

- 요청: `GET /api/query-practice/jpa/search?keyword=JPA&from=2026-10-01T00:00:00&to=2026-11-01T00:00:00`
- 조건: 공개 AND (제목 OR 본문) AND 시작<=createdAt<끝
- JPA @Query: `@Query 괄호 조건`
- MyBatis/SQL: `LIKE 두 개 괄호`
- 기대: 기간 끝 미포함
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q13 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · DeclaredQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class DeclaredQueryController {
    private final DeclaredQueryService service;
    public DeclaredQueryController(DeclaredQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.search(engine, params);
    }
    @GetMapping("/board-counts")
    public List<BoardCountRow> boardCounts(@PathVariable String engine) { return service.boardCounts(engine); }
}
```

**Service · DeclaredQueryService.java**

```java
package org.example.querypractice;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DeclaredQueryService {
    private final DeclaredPostRepository repository;
    private final DeclaredPostMapper mapper;
    public DeclaredQueryService(DeclaredPostRepository repository, DeclaredPostMapper mapper) {
        this.repository = repository; this.mapper = mapper;
    }
    public QueryPage search(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        SearchFilter filter = SearchFilter.parse(params);
        if (engine.equals("mybatis")) return new QueryPage(mapper.search(filter), filter.page(), filter.size(), mapper.count(filter));
        var page = repository.search(filter, filter.pageable());
        return new QueryPage(page.getContent(), filter.page(), filter.size(), page.getTotalElements());
    }
    public List<BoardCountRow> boardCounts(String engine) {
        QueryInputs.engine(engine);
        return engine.equals("jpa") ? repository.boardCounts() : mapper.boardCounts();
    }
}
```

**DTO · SearchFilter.java**

```java
package org.example.querypractice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public record SearchFilter(String boardSlug, Long authorId, String pattern, String tag,
                           LocalDateTime from, LocalDateTime to, int page, int size, String sort) {
    public static SearchFilter parse(Map<String, String> params) {
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        String tag = QueryInputs.text(params, "tag", 30);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        LocalDateTime from = date(params.get("from"), "from");
        LocalDateTime to = date(params.get("to"), "to");
        if (from != null && to != null && !from.isBefore(to)) throw QueryInputs.bad("from/to");
        String sort = params.getOrDefault("sort", "latest");
        if (!sort.equals("latest") && !sort.equals("likes")) throw QueryInputs.bad("sort");
        return new SearchFilter(board, author, QueryInputs.pattern(keyword), tag, from, to,
                QueryInputs.number(params, "page", 0, 0, 10000), QueryInputs.number(params, "size", 10, 1, 50), sort);
    }
    private static LocalDateTime date(String value, String field) {
        if (value == null) return null;
        try { return LocalDateTime.parse(value); }
        catch (DateTimeParseException e) { throw QueryInputs.bad(field); }
    }
    public long offset() { return (long) page * size; }
    public PageRequest pageable() {
        Sort order = Sort.by(Sort.Direction.DESC, "id");
        if (sort.equals("likes")) order = Sort.by(Sort.Direction.DESC, "likeCount").and(order);
        return PageRequest.of(page, size, order);
    }
}
```

**DTO · QueryPostRow.java**

```java
package org.example.querypractice;

import org.example.post.Post;

// 엔티티 전체를 JSON으로 노출하지 않고 이번 화면에 필요한 열만 반환한다.
public record QueryPostRow(Long id, String title, String boardSlug, Long authorId) {
    public static QueryPostRow of(Post post) {
        return new QueryPostRow(post.getId(), post.getTitle(), post.getBoard().getSlug(), post.getAuthor().getId());
    }
}
```

**JPA Repository · DeclaredPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeclaredPostRepository extends Repository<Post, Long> {
    String FILTER = """
        from Post p join p.board b join p.author a
        where p.deletedAt is null and p.hiddenAt is null and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
          and (:#{#f.boardSlug()} is null or b.slug = :#{#f.boardSlug()})
          and (:#{#f.authorId()} is null or a.id = :#{#f.authorId()})
          and (:#{#f.pattern()} is null or (lower(p.title) like lower(:#{#f.pattern()}) escape '!'
                                            or lower(p.content) like lower(:#{#f.pattern()}) escape '!'))
          and (:#{#f.tag()} is null or exists (select t.id from Post other join other.tags t where other.id = p.id and t.name = :#{#f.tag()}))
          and (:#{#f.from()} is null or p.createdAt >= :#{#f.from()})
          and (:#{#f.to()} is null or p.createdAt < :#{#f.to()})
        """;

    // JPQL은 post/board_id 같은 SQL 이름이 아니라 Post/board 같은 Java 이름을 쓴다.
    @Query(value = "select new org.example.querypractice.QueryPostRow(p.id, p.title, b.slug, a.id) " + FILTER,
           countQuery = "select count(p.id) " + FILTER)
    Page<QueryPostRow> search(@Param("f") SearchFilter filter, Pageable pageable);

    // 공개 글이 없는 게시판도 0으로 반환하려고 노출 조건을 WHERE 대신 ON에 둔다.
    @Query("""
        select new org.example.querypractice.BoardCountRow(b.slug, count(p.id))
        from Board b left join Post p on p.board = b and p.deletedAt is null and p.hiddenAt is null
             and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
        group by b.slug order by b.slug
        """)
    List<BoardCountRow> boardCounts();
}
```

**MyBatis Mapper/XML · DeclaredPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.DeclaredPostMapper">
    <sql id="filters">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        <if test="f.boardSlug != null">AND b.slug = #{f.boardSlug}</if>
        <if test="f.authorId != null">AND p.author_id = #{f.authorId}</if>
        <if test="f.pattern != null">AND (LOWER(p.title) LIKE LOWER(#{f.pattern}) ESCAPE '!' OR LOWER(p.content) LIKE LOWER(#{f.pattern}) ESCAPE '!')</if>
        <if test="f.tag != null">AND EXISTS (SELECT 1 FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name = #{f.tag})</if>
        <if test="f.from != null">AND p.created_at &gt;= #{f.from}</if>
        <if test="f.to != null">AND p.created_at &lt; #{f.to}</if>
    </sql>
    <select id="search" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="filters"/>
        <choose><when test="f.sort == 'likes'">ORDER BY p.like_count DESC, p.id DESC</when><otherwise>ORDER BY p.id DESC</otherwise></choose>
        LIMIT #{f.size} OFFSET #{f.offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id WHERE <include refid="filters"/>
    </select>
    <select id="boardCounts" resultType="org.example.querypractice.BoardCountRow">
        SELECT b.slug AS board_slug, COUNT(p.id) AS post_count FROM board b
        LEFT JOIN post p ON p.board_id = b.id AND p.deleted_at IS NULL AND p.hidden_at IS NULL
                        AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        GROUP BY b.slug ORDER BY b.slug
    </select>
</mapper>
```

</details>


practice 프로필의 기준 시각은 `2026-10-05T00:00:00`입니다. 그때 생성한 글은 `from=2026-10-05T00:00:00&to=2026-10-05T00:00:01`에 포함되고, `to=2026-10-05T00:00:00`에는 포함되지 않아야 합니다.

### Q14. 정렬·전체 건수

- 요청: `GET /api/query-practice/mybatis/search?sort=likes&page=0&size=5`
- 조건: likeCount DESC,id DESC
- JPA @Query: `Pageable + countQuery`
- MyBatis/SQL: `ORDER BY + COUNT`
- 기대: 두 엔진 일치
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q14 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · DeclaredQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class DeclaredQueryController {
    private final DeclaredQueryService service;
    public DeclaredQueryController(DeclaredQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.search(engine, params);
    }
    @GetMapping("/board-counts")
    public List<BoardCountRow> boardCounts(@PathVariable String engine) { return service.boardCounts(engine); }
}
```

**Service · DeclaredQueryService.java**

```java
package org.example.querypractice;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DeclaredQueryService {
    private final DeclaredPostRepository repository;
    private final DeclaredPostMapper mapper;
    public DeclaredQueryService(DeclaredPostRepository repository, DeclaredPostMapper mapper) {
        this.repository = repository; this.mapper = mapper;
    }
    public QueryPage search(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        SearchFilter filter = SearchFilter.parse(params);
        if (engine.equals("mybatis")) return new QueryPage(mapper.search(filter), filter.page(), filter.size(), mapper.count(filter));
        var page = repository.search(filter, filter.pageable());
        return new QueryPage(page.getContent(), filter.page(), filter.size(), page.getTotalElements());
    }
    public List<BoardCountRow> boardCounts(String engine) {
        QueryInputs.engine(engine);
        return engine.equals("jpa") ? repository.boardCounts() : mapper.boardCounts();
    }
}
```

**DTO · SearchFilter.java**

```java
package org.example.querypractice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public record SearchFilter(String boardSlug, Long authorId, String pattern, String tag,
                           LocalDateTime from, LocalDateTime to, int page, int size, String sort) {
    public static SearchFilter parse(Map<String, String> params) {
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        String tag = QueryInputs.text(params, "tag", 30);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        LocalDateTime from = date(params.get("from"), "from");
        LocalDateTime to = date(params.get("to"), "to");
        if (from != null && to != null && !from.isBefore(to)) throw QueryInputs.bad("from/to");
        String sort = params.getOrDefault("sort", "latest");
        if (!sort.equals("latest") && !sort.equals("likes")) throw QueryInputs.bad("sort");
        return new SearchFilter(board, author, QueryInputs.pattern(keyword), tag, from, to,
                QueryInputs.number(params, "page", 0, 0, 10000), QueryInputs.number(params, "size", 10, 1, 50), sort);
    }
    private static LocalDateTime date(String value, String field) {
        if (value == null) return null;
        try { return LocalDateTime.parse(value); }
        catch (DateTimeParseException e) { throw QueryInputs.bad(field); }
    }
    public long offset() { return (long) page * size; }
    public PageRequest pageable() {
        Sort order = Sort.by(Sort.Direction.DESC, "id");
        if (sort.equals("likes")) order = Sort.by(Sort.Direction.DESC, "likeCount").and(order);
        return PageRequest.of(page, size, order);
    }
}
```

**DTO · QueryPostRow.java**

```java
package org.example.querypractice;

import org.example.post.Post;

// 엔티티 전체를 JSON으로 노출하지 않고 이번 화면에 필요한 열만 반환한다.
public record QueryPostRow(Long id, String title, String boardSlug, Long authorId) {
    public static QueryPostRow of(Post post) {
        return new QueryPostRow(post.getId(), post.getTitle(), post.getBoard().getSlug(), post.getAuthor().getId());
    }
}
```

**JPA Repository · DeclaredPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeclaredPostRepository extends Repository<Post, Long> {
    String FILTER = """
        from Post p join p.board b join p.author a
        where p.deletedAt is null and p.hiddenAt is null and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
          and (:#{#f.boardSlug()} is null or b.slug = :#{#f.boardSlug()})
          and (:#{#f.authorId()} is null or a.id = :#{#f.authorId()})
          and (:#{#f.pattern()} is null or (lower(p.title) like lower(:#{#f.pattern()}) escape '!'
                                            or lower(p.content) like lower(:#{#f.pattern()}) escape '!'))
          and (:#{#f.tag()} is null or exists (select t.id from Post other join other.tags t where other.id = p.id and t.name = :#{#f.tag()}))
          and (:#{#f.from()} is null or p.createdAt >= :#{#f.from()})
          and (:#{#f.to()} is null or p.createdAt < :#{#f.to()})
        """;

    // JPQL은 post/board_id 같은 SQL 이름이 아니라 Post/board 같은 Java 이름을 쓴다.
    @Query(value = "select new org.example.querypractice.QueryPostRow(p.id, p.title, b.slug, a.id) " + FILTER,
           countQuery = "select count(p.id) " + FILTER)
    Page<QueryPostRow> search(@Param("f") SearchFilter filter, Pageable pageable);

    // 공개 글이 없는 게시판도 0으로 반환하려고 노출 조건을 WHERE 대신 ON에 둔다.
    @Query("""
        select new org.example.querypractice.BoardCountRow(b.slug, count(p.id))
        from Board b left join Post p on p.board = b and p.deletedAt is null and p.hiddenAt is null
             and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
        group by b.slug order by b.slug
        """)
    List<BoardCountRow> boardCounts();
}
```

**MyBatis Mapper/XML · DeclaredPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.DeclaredPostMapper">
    <sql id="filters">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        <if test="f.boardSlug != null">AND b.slug = #{f.boardSlug}</if>
        <if test="f.authorId != null">AND p.author_id = #{f.authorId}</if>
        <if test="f.pattern != null">AND (LOWER(p.title) LIKE LOWER(#{f.pattern}) ESCAPE '!' OR LOWER(p.content) LIKE LOWER(#{f.pattern}) ESCAPE '!')</if>
        <if test="f.tag != null">AND EXISTS (SELECT 1 FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name = #{f.tag})</if>
        <if test="f.from != null">AND p.created_at &gt;= #{f.from}</if>
        <if test="f.to != null">AND p.created_at &lt; #{f.to}</if>
    </sql>
    <select id="search" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="filters"/>
        <choose><when test="f.sort == 'likes'">ORDER BY p.like_count DESC, p.id DESC</when><otherwise>ORDER BY p.id DESC</otherwise></choose>
        LIMIT #{f.size} OFFSET #{f.offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id WHERE <include refid="filters"/>
    </select>
    <select id="boardCounts" resultType="org.example.querypractice.BoardCountRow">
        SELECT b.slug AS board_slug, COUNT(p.id) AS post_count FROM board b
        LEFT JOIN post p ON p.board_id = b.id AND p.deleted_at IS NULL AND p.hidden_at IS NULL
                        AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        GROUP BY b.slug ORDER BY b.slug
    </select>
</mapper>
```

</details>


## 직접 확인

1. 각 요청의 id/items/total을 기록합니다.
2. 같은 필터를 JPA·MyBatis에 보내 비교합니다. L14는 QueryDSL도 비교합니다.
3. 기존 API로 수정→좋아요·북마크→숨김→복구→삭제하고 같은 id의 조회 결과를 확인합니다.
4. 잘못된 page/size, 빈 결과, 문자 %/_/! 검색과 공개 조건을 확인합니다.

## 역할별 전체 코드

각 토글은 추가/덮어쓰기 파일의 전문입니다. 기존 본편 Controller·Service·Entity는 최종 snapshot에서 함께 확인합니다.

<details><summary>DTO·입력 · BoardCountRow.java</summary>

`src/main/java/org/example/querypractice/BoardCountRow.java`

```java
package org.example.querypractice;

public record BoardCountRow(String boardSlug, long postCount) {}
```

</details>

<details><summary>Mapper/XML · DeclaredPostMapper.java</summary>

`src/main/java/org/example/querypractice/DeclaredPostMapper.java`

```java
package org.example.querypractice;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DeclaredPostMapper {
    List<QueryPostRow> search(@Param("f") SearchFilter filter);
    long count(@Param("f") SearchFilter filter);
    List<BoardCountRow> boardCounts();
}
```

</details>

<details><summary>Repository · DeclaredPostRepository.java</summary>

`src/main/java/org/example/querypractice/DeclaredPostRepository.java`

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeclaredPostRepository extends Repository<Post, Long> {
    String FILTER = """
        from Post p join p.board b join p.author a
        where p.deletedAt is null and p.hiddenAt is null and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
          and (:#{#f.boardSlug()} is null or b.slug = :#{#f.boardSlug()})
          and (:#{#f.authorId()} is null or a.id = :#{#f.authorId()})
          and (:#{#f.pattern()} is null or (lower(p.title) like lower(:#{#f.pattern()}) escape '!'
                                            or lower(p.content) like lower(:#{#f.pattern()}) escape '!'))
          and (:#{#f.tag()} is null or exists (select t.id from Post other join other.tags t where other.id = p.id and t.name = :#{#f.tag()}))
          and (:#{#f.from()} is null or p.createdAt >= :#{#f.from()})
          and (:#{#f.to()} is null or p.createdAt < :#{#f.to()})
        """;

    // JPQL은 post/board_id 같은 SQL 이름이 아니라 Post/board 같은 Java 이름을 쓴다.
    @Query(value = "select new org.example.querypractice.QueryPostRow(p.id, p.title, b.slug, a.id) " + FILTER,
           countQuery = "select count(p.id) " + FILTER)
    Page<QueryPostRow> search(@Param("f") SearchFilter filter, Pageable pageable);

    // 공개 글이 없는 게시판도 0으로 반환하려고 노출 조건을 WHERE 대신 ON에 둔다.
    @Query("""
        select new org.example.querypractice.BoardCountRow(b.slug, count(p.id))
        from Board b left join Post p on p.board = b and p.deletedAt is null and p.hiddenAt is null
             and p.status = 'PUBLISHED' and p.visibility = 'PUBLIC'
        group by b.slug order by b.slug
        """)
    List<BoardCountRow> boardCounts();
}
```

</details>

<details><summary>Controller · DeclaredQueryController.java</summary>

`src/main/java/org/example/querypractice/DeclaredQueryController.java`

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class DeclaredQueryController {
    private final DeclaredQueryService service;
    public DeclaredQueryController(DeclaredQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.search(engine, params);
    }
    @GetMapping("/board-counts")
    public List<BoardCountRow> boardCounts(@PathVariable String engine) { return service.boardCounts(engine); }
}
```

</details>

<details><summary>Service · DeclaredQueryService.java</summary>

`src/main/java/org/example/querypractice/DeclaredQueryService.java`

```java
package org.example.querypractice;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DeclaredQueryService {
    private final DeclaredPostRepository repository;
    private final DeclaredPostMapper mapper;
    public DeclaredQueryService(DeclaredPostRepository repository, DeclaredPostMapper mapper) {
        this.repository = repository; this.mapper = mapper;
    }
    public QueryPage search(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        SearchFilter filter = SearchFilter.parse(params);
        if (engine.equals("mybatis")) return new QueryPage(mapper.search(filter), filter.page(), filter.size(), mapper.count(filter));
        var page = repository.search(filter, filter.pageable());
        return new QueryPage(page.getContent(), filter.page(), filter.size(), page.getTotalElements());
    }
    public List<BoardCountRow> boardCounts(String engine) {
        QueryInputs.engine(engine);
        return engine.equals("jpa") ? repository.boardCounts() : mapper.boardCounts();
    }
}
```

</details>

<details><summary>DTO·입력 · SearchFilter.java</summary>

`src/main/java/org/example/querypractice/SearchFilter.java`

```java
package org.example.querypractice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public record SearchFilter(String boardSlug, Long authorId, String pattern, String tag,
                           LocalDateTime from, LocalDateTime to, int page, int size, String sort) {
    public static SearchFilter parse(Map<String, String> params) {
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        String tag = QueryInputs.text(params, "tag", 30);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        LocalDateTime from = date(params.get("from"), "from");
        LocalDateTime to = date(params.get("to"), "to");
        if (from != null && to != null && !from.isBefore(to)) throw QueryInputs.bad("from/to");
        String sort = params.getOrDefault("sort", "latest");
        if (!sort.equals("latest") && !sort.equals("likes")) throw QueryInputs.bad("sort");
        return new SearchFilter(board, author, QueryInputs.pattern(keyword), tag, from, to,
                QueryInputs.number(params, "page", 0, 0, 10000), QueryInputs.number(params, "size", 10, 1, 50), sort);
    }
    private static LocalDateTime date(String value, String field) {
        if (value == null) return null;
        try { return LocalDateTime.parse(value); }
        catch (DateTimeParseException e) { throw QueryInputs.bad(field); }
    }
    public long offset() { return (long) page * size; }
    public PageRequest pageable() {
        Sort order = Sort.by(Sort.Direction.DESC, "id");
        if (sort.equals("likes")) order = Sort.by(Sort.Direction.DESC, "likeCount").and(order);
        return PageRequest.of(page, size, order);
    }
}
```

</details>

<details><summary>Mapper/XML · DeclaredPostMapper.xml</summary>

`src/main/resources/mapper/DeclaredPostMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.DeclaredPostMapper">
    <sql id="filters">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        <if test="f.boardSlug != null">AND b.slug = #{f.boardSlug}</if>
        <if test="f.authorId != null">AND p.author_id = #{f.authorId}</if>
        <if test="f.pattern != null">AND (LOWER(p.title) LIKE LOWER(#{f.pattern}) ESCAPE '!' OR LOWER(p.content) LIKE LOWER(#{f.pattern}) ESCAPE '!')</if>
        <if test="f.tag != null">AND EXISTS (SELECT 1 FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name = #{f.tag})</if>
        <if test="f.from != null">AND p.created_at &gt;= #{f.from}</if>
        <if test="f.to != null">AND p.created_at &lt; #{f.to}</if>
    </sql>
    <select id="search" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="filters"/>
        <choose><when test="f.sort == 'likes'">ORDER BY p.like_count DESC, p.id DESC</when><otherwise>ORDER BY p.id DESC</otherwise></choose>
        LIMIT #{f.size} OFFSET #{f.offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id WHERE <include refid="filters"/>
    </select>
    <select id="boardCounts" resultType="org.example.querypractice.BoardCountRow">
        SELECT b.slug AS board_slug, COUNT(p.id) AS post_count FROM board b
        LEFT JOIN post p ON p.board_id = b.id AND p.deleted_at IS NULL AND p.hidden_at IS NULL
                        AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
        GROUP BY b.slug ORDER BY b.slug
    </select>
</mapper>
```

</details>


## 자동 요청 확인

practice 프로필의 요청 패널에서 순서대로 실행합니다. 생성 응답 ID가 다음 요청에 전달됩니다. 운영자 요청은 연습용 관리자 토큰을 사용합니다.

```check
{
  "requests": [
    {
      "id": "P",
      "title": "공개 글 생성",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "boardSlug": "dev",
        "title": "[쿼리연습] JPA 연결",
        "content": "본문 JPA 검색",
        "tags": [
          "spring"
        ],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "A",
      "title": "JPA JOIN DTO",
      "method": "GET",
      "path": "/api/query-practice/jpa/search?boardSlug=dev&authorId={{P.body.author.id}}"
    },
    {
      "id": "B",
      "title": "MyBatis JOIN DTO",
      "method": "GET",
      "path": "/api/query-practice/mybatis/search?boardSlug=dev&authorId={{P.body.author.id}}"
    },
    {
      "id": "C",
      "title": "JPA 태그",
      "method": "GET",
      "path": "/api/query-practice/jpa/search?tag=spring"
    },
    {
      "id": "D",
      "title": "MyBatis 태그",
      "method": "GET",
      "path": "/api/query-practice/mybatis/search?tag=spring"
    },
    {
      "id": "E",
      "title": "JPA 게시판 집계",
      "method": "GET",
      "path": "/api/query-practice/jpa/board-counts"
    },
    {
      "id": "F",
      "title": "MyBatis 게시판 집계",
      "method": "GET",
      "path": "/api/query-practice/mybatis/board-counts"
    },
    {
      "id": "G",
      "title": "JPA 제목·본문·기간",
      "method": "GET",
      "path": "/api/query-practice/jpa/search?keyword=JPA&from=2026-10-01T00%3A00%3A00&to=2026-11-01T00%3A00%3A00"
    },
    {
      "id": "H",
      "title": "MyBatis 제목·본문·기간",
      "method": "GET",
      "path": "/api/query-practice/mybatis/search?keyword=JPA&from=2026-10-01T00%3A00%3A00&to=2026-11-01T00%3A00%3A00"
    },
    {
      "id": "I",
      "title": "JPA 좋아요 정렬",
      "method": "GET",
      "path": "/api/query-practice/jpa/search?sort=likes&page=0&size=3"
    },
    {
      "id": "J",
      "title": "MyBatis 좋아요 정렬",
      "method": "GET",
      "path": "/api/query-practice/mybatis/search?sort=likes&page=0&size=3"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "equals": "{{B.body.items}}"
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.total",
            "equals": "{{A.body.total}}"
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "C",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "equals": "{{D.body.items}}"
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "E",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$",
            "equals": "{{F.body}}"
          }
        ]
      }
    },
    {
      "id": "C5",
      "request": "G",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "equals": "{{H.body.items}}"
          }
        ]
      }
    },
    {
      "id": "C6",
      "request": "I",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "equals": "{{J.body.items}}"
          }
        ]
      }
    }
  ]
}
```

## 채점 기준

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 패널 1번째 확인 · DTO projection | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C2 | 요청 패널 2번째 확인 · 게시판·작성자 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C3 | 요청 패널 3번째 확인 · 태그 관계 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C4 | 요청 패널 4번째 확인 · 빈 게시판 집계 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C5 | 요청 패널 5번째 확인 · 제목 또는 본문·기간 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C6 | 요청 패널 6번째 확인 · 정렬·전체 건수 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
