# L12. 기초 파생 메서드·MyBatis SQL

> 최종 본편 16-4 · practice DB에서 연속 실행

## 상황과 개념

Spring Data의 findBy 뒤는 Post의 Java 속성(id/deletedAt/hiddenAt/status/visibility)과 IsNull·And 키워드를 분석합니다. Board_Slug는 board.slug 연관 경로입니다. 이 프로젝트에 hide boolean은 없으므로 HiddenAtIsNull을 씁니다. MyBatis는 함수 이름을 분석하지 않고 XML SQL을 실행합니다. [Spring Data 공식 문서](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html) · [속성 경로](https://docs.spring.io/spring-data/commons/reference/repositories/query-methods-details.html) · [MyBatis 매퍼](https://mybatis.org/mybatis-3/sqlmap-xml.html).

## 실행 준비

저장소 루트에서 `python3 tools/materialize-query-practice.py --output /tmp/query-practice --through l12-query-methods`를 실행합니다. 처음 L12를 적용할 때 출력 디렉터리는 비어 있어야 합니다. 이후 L13·L14에서 같은 경로로 명령을 다시 실행하면 다음 overlay만 적용됩니다. Java 21로 복원 폴더에서 `./gradlew bootRun --args="--spring.profiles.active=practice"`를 실행합니다. DB 접속은 SPRING_DATASOURCE_URL/SPRING_DATASOURCE_USERNAME/SPRING_DATASOURCE_PASSWORD 환경변수로 조정합니다. L13은 L12 위에, L14는 L12와 L13 위에 적용됩니다.

기존 POST /api/posts에 작성자 토큰과 `{"boardSlug":"dev","title":"쿼리 연습 JPA","content":"본문","tags":["spring"],"visibility":"PUBLIC"}`를 보내 201 응답의 id를 받으세요. 같은 DB에서 이 id를 아래 {id}로 사용합니다. 새 API는 공개 데이터 비교용이며 개인별 권한은 기존 API에서 확인합니다.

## 순서대로 구현할 시나리오

### Q01. 생성 후 상세

- 요청: `GET /api/query-practice/jpa/posts/{id}`
- 조건: id와 공개 조건
- JPA 파생 메서드: `findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility`
- MyBatis/SQL: `WHERE id=? AND 공개조건`
- 기대: 200/404
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q01 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · BasicQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
```

**Service · BasicQueryService.java**

```java
package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
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

**DTO · QueryPage.java**

```java
package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
```

**JPA Repository · DerivedPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
```

**MyBatis Mapper/XML · BasicPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.BasicPostMapper">
    <sql id="visible">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    </sql>
    <sql id="filters">
        <if test="board != null">AND b.slug = #{board}</if>
        <if test="author != null">AND p.author_id = #{author}</if>
        <if test="pattern != null">AND LOWER(p.title) LIKE LOWER(#{pattern}) ESCAPE '!'</if>
    </sql>
    <select id="detail" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE p.id = #{id} AND <include refid="visible"/>
    </select>
    <select id="list" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
        ORDER BY p.id DESC LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
    </select>
    <select id="exists" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM post p WHERE p.id = #{id} AND <include refid="visible"/>)
    </select>
</mapper>
```

</details>


### Q02. 숨김·삭제·비공개 제외

- 요청: `GET /api/query-practice/mybatis/posts/{id}`
- 조건: deletedAt/hiddenAt NULL, status PUBLISHED, visibility PUBLIC
- JPA 파생 메서드: `...DeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility`
- MyBatis/SQL: `WHERE 공개조건`
- 기대: 조건 밖 404
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q02 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · BasicQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
```

**Service · BasicQueryService.java**

```java
package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
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

**DTO · QueryPage.java**

```java
package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
```

**JPA Repository · DerivedPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
```

**MyBatis Mapper/XML · BasicPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.BasicPostMapper">
    <sql id="visible">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    </sql>
    <sql id="filters">
        <if test="board != null">AND b.slug = #{board}</if>
        <if test="author != null">AND p.author_id = #{author}</if>
        <if test="pattern != null">AND LOWER(p.title) LIKE LOWER(#{pattern}) ESCAPE '!'</if>
    </sql>
    <select id="detail" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE p.id = #{id} AND <include refid="visible"/>
    </select>
    <select id="list" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
        ORDER BY p.id DESC LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
    </select>
    <select id="exists" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM post p WHERE p.id = #{id} AND <include refid="visible"/>)
    </select>
</mapper>
```

</details>


### Q03. 게시판 조회

- 요청: `GET /api/query-practice/jpa/posts?boardSlug=dev`
- 조건: board.slug=dev
- JPA 파생 메서드: `...AndBoard_Slug`
- MyBatis/SQL: `JOIN board AND slug=?`
- 기대: items/total
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q03 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · BasicQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
```

**Service · BasicQueryService.java**

```java
package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
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

**DTO · QueryPage.java**

```java
package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
```

**JPA Repository · DerivedPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
```

**MyBatis Mapper/XML · BasicPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.BasicPostMapper">
    <sql id="visible">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    </sql>
    <sql id="filters">
        <if test="board != null">AND b.slug = #{board}</if>
        <if test="author != null">AND p.author_id = #{author}</if>
        <if test="pattern != null">AND LOWER(p.title) LIKE LOWER(#{pattern}) ESCAPE '!'</if>
    </sql>
    <select id="detail" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE p.id = #{id} AND <include refid="visible"/>
    </select>
    <select id="list" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
        ORDER BY p.id DESC LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
    </select>
    <select id="exists" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM post p WHERE p.id = #{id} AND <include refid="visible"/>)
    </select>
</mapper>
```

</details>


### Q04. 작성자 조회

- 요청: `GET /api/query-practice/mybatis/posts?authorId=5`
- 조건: author.id=5
- JPA 파생 메서드: `...AndAuthor_Id`
- MyBatis/SQL: `author_id=?`
- 기대: items/total
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q04 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · BasicQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
```

**Service · BasicQueryService.java**

```java
package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
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

**DTO · QueryPage.java**

```java
package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
```

**JPA Repository · DerivedPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
```

**MyBatis Mapper/XML · BasicPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.BasicPostMapper">
    <sql id="visible">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    </sql>
    <sql id="filters">
        <if test="board != null">AND b.slug = #{board}</if>
        <if test="author != null">AND p.author_id = #{author}</if>
        <if test="pattern != null">AND LOWER(p.title) LIKE LOWER(#{pattern}) ESCAPE '!'</if>
    </sql>
    <select id="detail" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE p.id = #{id} AND <include refid="visible"/>
    </select>
    <select id="list" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
        ORDER BY p.id DESC LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
    </select>
    <select id="exists" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM post p WHERE p.id = #{id} AND <include refid="visible"/>)
    </select>
</mapper>
```

</details>


### Q05. 제목 검색

- 요청: `GET /api/query-practice/jpa/posts?keyword=JPA`
- 조건: 대소문자 무시, 와일드카드는 문자
- JPA 파생 메서드: `...AndTitleContainingIgnoreCase`
- MyBatis/SQL: `LOWER(title) LIKE ... ESCAPE !`
- 기대: 포함된 글만
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q05 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · BasicQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
```

**Service · BasicQueryService.java**

```java
package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
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

**DTO · QueryPage.java**

```java
package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
```

**JPA Repository · DerivedPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
```

**MyBatis Mapper/XML · BasicPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.BasicPostMapper">
    <sql id="visible">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    </sql>
    <sql id="filters">
        <if test="board != null">AND b.slug = #{board}</if>
        <if test="author != null">AND p.author_id = #{author}</if>
        <if test="pattern != null">AND LOWER(p.title) LIKE LOWER(#{pattern}) ESCAPE '!'</if>
    </sql>
    <select id="detail" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE p.id = #{id} AND <include refid="visible"/>
    </select>
    <select id="list" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
        ORDER BY p.id DESC LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
    </select>
    <select id="exists" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM post p WHERE p.id = #{id} AND <include refid="visible"/>)
    </select>
</mapper>
```

</details>


### Q06. 존재 확인

- 요청: `GET /api/query-practice/jpa/posts/{id}/exists`
- 조건: 공개 글인가
- JPA 파생 메서드: `existsByIdAnd...`
- MyBatis/SQL: `SELECT EXISTS`
- 기대: exists true/false
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q06 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · BasicQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
```

**Service · BasicQueryService.java**

```java
package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
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

**DTO · QueryPage.java**

```java
package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
```

**JPA Repository · DerivedPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
```

**MyBatis Mapper/XML · BasicPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.BasicPostMapper">
    <sql id="visible">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    </sql>
    <sql id="filters">
        <if test="board != null">AND b.slug = #{board}</if>
        <if test="author != null">AND p.author_id = #{author}</if>
        <if test="pattern != null">AND LOWER(p.title) LIKE LOWER(#{pattern}) ESCAPE '!'</if>
    </sql>
    <select id="detail" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE p.id = #{id} AND <include refid="visible"/>
    </select>
    <select id="list" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
        ORDER BY p.id DESC LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
    </select>
    <select id="exists" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM post p WHERE p.id = #{id} AND <include refid="visible"/>)
    </select>
</mapper>
```

</details>


### Q07. 게시판 글 수

- 요청: `GET /api/query-practice/mybatis/count?boardSlug=dev`
- 조건: 공개 글 수
- JPA 파생 메서드: `countBy...AndBoard_Slug`
- MyBatis/SQL: `COUNT(*)`
- 기대: count n
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q07 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · BasicQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
```

**Service · BasicQueryService.java**

```java
package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
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

**DTO · QueryPage.java**

```java
package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
```

**JPA Repository · DerivedPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
```

**MyBatis Mapper/XML · BasicPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.BasicPostMapper">
    <sql id="visible">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    </sql>
    <sql id="filters">
        <if test="board != null">AND b.slug = #{board}</if>
        <if test="author != null">AND p.author_id = #{author}</if>
        <if test="pattern != null">AND LOWER(p.title) LIKE LOWER(#{pattern}) ESCAPE '!'</if>
    </sql>
    <select id="detail" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE p.id = #{id} AND <include refid="visible"/>
    </select>
    <select id="list" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
        ORDER BY p.id DESC LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
    </select>
    <select id="exists" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM post p WHERE p.id = #{id} AND <include refid="visible"/>)
    </select>
</mapper>
```

</details>


### Q08. 페이지

- 요청: `GET /api/query-practice/jpa/posts?page=0&size=10`
- 조건: id DESC, size 1~50
- JPA 파생 메서드: `Pageable`
- MyBatis/SQL: `ORDER BY id DESC LIMIT/OFFSET`
- 기대: items/total/page/size
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q08 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · BasicQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
```

**Service · BasicQueryService.java**

```java
package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
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

**DTO · QueryPage.java**

```java
package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
```

**JPA Repository · DerivedPostRepository.java**

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
```

**MyBatis Mapper/XML · BasicPostMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.BasicPostMapper">
    <sql id="visible">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    </sql>
    <sql id="filters">
        <if test="board != null">AND b.slug = #{board}</if>
        <if test="author != null">AND p.author_id = #{author}</if>
        <if test="pattern != null">AND LOWER(p.title) LIKE LOWER(#{pattern}) ESCAPE '!'</if>
    </sql>
    <select id="detail" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE p.id = #{id} AND <include refid="visible"/>
    </select>
    <select id="list" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
        ORDER BY p.id DESC LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
    </select>
    <select id="exists" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM post p WHERE p.id = #{id} AND <include refid="visible"/>)
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

<details><summary>설정 · build.gradle</summary>

`build.gradle`

```groovy
plugins {
    id 'java'
    // bootRun / bootJar 태스크 제공 + 실행 가능한 fat jar 패키징
    id 'org.springframework.boot' version '4.1.1'
    // Boot BOM을 적용해서 아래 의존성들의 버전을 생략할 수 있게 해줌
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'org.example'
version = '1.0-SNAPSHOT'

java {
    toolchain {
        // 컴파일·실행 JDK를 고정 (Boot 4는 Java 17 이상 필요, 로컬에 설치된 21 사용)
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    // Spring MVC + 내장 Tomcat + Jackson (Boot 4부터 starter-web → starter-webmvc로 이름 변경)
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    // JPA(Hibernate) + HikariCP 커넥션 풀
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'
    // @Valid, @NotBlank 같은 요청 값 검증
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    // MySQL JDBC 드라이버 — 컴파일엔 필요 없고 실행할 때만 필요
    runtimeOnly 'com.mysql:mysql-connector-j'
    // 9-1 스키마 변경은 Flyway 마이그레이션(db/migration)으로만 한다
    implementation 'org.springframework.boot:spring-boot-starter-flyway'
    runtimeOnly 'org.flywaydb:flyway-mysql'
    // 13-7 API 문서(OpenAPI 3.1 + Swagger UI) — springdoc 3.x가 Spring Boot 4용(3.1.1은 Boot 4.1.0 기준으로 빌드됨).
    // Boot BOM이 관리하지 않는 라이브러리라 버전을 직접 적는다
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1'
    // 16-3 인기글 캐시 — Spring Cache 추상화 + 로컬 메모리 캐시(Caffeine, TTL 지원)
    implementation 'org.springframework.boot:spring-boot-starter-cache'
    implementation 'com.github.ben-manes.caffeine:caffeine'

    // 테스트: JUnit·AssertJ·Mockito·MockMvc 묶음 (버전은 Boot BOM이 관리하므로 junit-bom 따로 두지 않음)
    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
    // @DataJpaTest(리포지토리만 띄우는 테스트)
    testImplementation 'org.springframework.boot:spring-boot-starter-data-jpa-test'
    // 테스트용 일회용 MySQL 컨테이너 — application-test.yml의 jdbc:tc: URL이 쓴다
    testImplementation 'org.testcontainers:testcontainers-mysql'
    // Gradle이 JUnit Platform 테스트를 실행할 때 필요한 런처
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

tasks.named('test') {
    useJUnitPlatform()
    // 테스트는 application-test.yml(Testcontainers MySQL)을 쓰게 한다
    systemProperty 'spring.profiles.active', 'test'
}
```

</details>

<details><summary>Mapper/XML · BasicPostMapper.java</summary>

`src/main/java/org/example/querypractice/BasicPostMapper.java`

```java
package org.example.querypractice;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface BasicPostMapper {
    QueryPostRow detail(@Param("id") long id);
    List<QueryPostRow> list(@Param("board") String board, @Param("author") Long author,
                           @Param("pattern") String pattern, @Param("limit") int limit, @Param("offset") long offset);
    long count(@Param("board") String board, @Param("author") Long author, @Param("pattern") String pattern);
    boolean exists(@Param("id") long id);
}
```

</details>

<details><summary>Controller · BasicQueryController.java</summary>

`src/main/java/org/example/querypractice/BasicQueryController.java`

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// practice에서만 제공하는 익명 공개 목록 비교 API. 개인화된 조회는 기존 /api/posts가 담당한다.
@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/{engine}")
public class BasicQueryController {
    private final BasicQueryService service;
    public BasicQueryController(BasicQueryService service) { this.service = service; }

    @GetMapping("/posts/{id}")
    public QueryPostRow detail(@PathVariable String engine, @PathVariable String id) {
        return service.detail(engine, id);
    }
    @GetMapping("/posts")
    public QueryPage list(@PathVariable String engine, @RequestParam Map<String, String> params) {
        return service.list(engine, params);
    }
    @GetMapping("/posts/{id}/exists")
    public Map<String, Boolean> exists(@PathVariable String engine, @PathVariable String id) {
        return Map.of("exists", service.exists(engine, id));
    }
    @GetMapping("/count")
    public Map<String, Long> count(@PathVariable String engine, @RequestParam String boardSlug) {
        return Map.of("count", service.count(engine, boardSlug));
    }
}
```

</details>

<details><summary>Service · BasicQueryService.java</summary>

`src/main/java/org/example/querypractice/BasicQueryService.java`

```java
package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
    }
}
```

</details>

<details><summary>Repository · DerivedPostRepository.java</summary>

`src/main/java/org/example/querypractice/DerivedPostRepository.java`

```java
package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
```

</details>

<details><summary>DTO·입력 · QueryInputs.java</summary>

`src/main/java/org/example/querypractice/QueryInputs.java`

```java
package org.example.querypractice;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

public final class QueryInputs {
    private QueryInputs() {}

    public static ResponseStatusException bad(String field) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " 값을 확인해 주세요.");
    }

    public static void engine(String engine) {
        if (!"jpa".equals(engine) && !"mybatis".equals(engine)) throw bad("engine");
    }

    public static long positive(String raw, String field) {
        if (raw == null || !raw.matches("[0-9]+")) throw bad(field);
        try {
            long value = Long.parseLong(raw);
            if (value > 0) return value;
        } catch (NumberFormatException ignored) { }
        throw bad(field);
    }

    public static int number(Map<String, String> params, String field, int fallback, int min, int max) {
        String raw = params.get(field);
        if (raw == null) return fallback;
        if (raw.matches("[0-9]+")) {
            try {
                int value = Integer.parseInt(raw);
                if (value >= min && value <= max) return value;
            } catch (NumberFormatException ignored) { }
        }
        throw bad(field);
    }

    public static String text(Map<String, String> params, String field, int max) {
        String value = params.get(field);
        if (value != null && (value.isBlank() || value.length() > max)) throw bad(field);
        return value;
    }

    // %, _도 사용자가 입력한 문자로 찾는다. SQL 와일드카드로 확장하지 않는다.
    public static String pattern(String keyword) {
        return keyword == null ? null : "%" + keyword.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    }
}
```

</details>

<details><summary>DTO·입력 · QueryPage.java</summary>

`src/main/java/org/example/querypractice/QueryPage.java`

```java
package org.example.querypractice;

import java.util.List;

public record QueryPage(List<QueryPostRow> items, int page, int size, long total) {}
```

</details>

<details><summary>DTO·입력 · QueryPostRow.java</summary>

`src/main/java/org/example/querypractice/QueryPostRow.java`

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

</details>

<details><summary>설정 · application.yml</summary>

`src/main/resources/application.yml`

```yaml
spring:
  application:
    name: javaExperience
  datasource:
    # javaExperience MySQL의 community DB. 시작하기 안내대로 javaExperience DB를 먼저 띄운다
    url: jdbc:mysql://localhost:13308/community?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
    username: community
    password: community
  flyway:
    # 이미 테이블·데이터가 있는 DB(compose의 community·practice)는 V1(CREATE TABLE)을 실행하면 실패한다.
    # 그래서 기록 테이블이 없으면 "V1까지 됐다"고만 적고(baseline) V2부터 실행한다. 빈 DB면 V1부터 실제로 실행한다.
    baseline-on-migrate: true
    baseline-version: 1
  servlet:
    multipart:
      # 11-2 이미지 한 장 1MB, 요청 전체 2MB까지. 넘으면 MaxUploadSizeExceededException → 413
      max-file-size: 1MB
      max-request-size: 2MB
  jpa:
    hibernate:
      # 스키마는 Flyway만 바꾼다(9-1). 엔티티가 테이블과 다르면 기동이 실패한다(테이블을 몰래 바꾸지 않음)
      ddl-auto: validate
    # 트랜잭션이 끝나면 커넥션을 바로 반납한다(컨트롤러·직렬화 단계까지 붙잡지 않음)
    open-in-view: false
    properties:
      hibernate:
        format_sql: true
        # 컬렉션(태그) 지연 로딩을 글마다 1번이 아니라 IN (...) 한 번으로 묶는다(2-4, N+1 대응)
        default_batch_fetch_size: 100
  # 16-3 인기글 캐시 — 60초 뒤 만료(expireAfterWrite), 키는 최대 100개
  cache:
    cache-names: popularPosts
    caffeine:
      spec: maximumSize=100,expireAfterWrite=60s

# 11-2 올린 이미지를 저장할 폴더(앱을 실행한 위치 기준). git에는 올리지 않는다(.gitignore)
app:
  upload-dir: uploads

logging:
  level:
    # 실행 SQL은 확인하되 토큰을 포함한 바인딩 값은 로그에 남기지 않는다
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: info

# 0-6 — 내가 정한 설정 값. 코드에서 @Value("${start.greeting}")로 읽는다
start:
  greeting: 반가워요, 백엔드!
  max-items: 5

# 13-7 앱 개발자가 문서를 열면 사용자용 API 그룹을 먼저 보여 준다.
springdoc:
  swagger-ui:
    urls-primary-name: public

mybatis:
  mapper-locations: classpath:mapper/**/*.xml
  configuration:
    map-underscore-to-camel-case: true
```

</details>

<details><summary>Mapper/XML · BasicPostMapper.xml</summary>

`src/main/resources/mapper/BasicPostMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.querypractice.BasicPostMapper">
    <sql id="visible">
        p.deleted_at IS NULL AND p.hidden_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'
    </sql>
    <sql id="filters">
        <if test="board != null">AND b.slug = #{board}</if>
        <if test="author != null">AND p.author_id = #{author}</if>
        <if test="pattern != null">AND LOWER(p.title) LIKE LOWER(#{pattern}) ESCAPE '!'</if>
    </sql>
    <select id="detail" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE p.id = #{id} AND <include refid="visible"/>
    </select>
    <select id="list" resultType="org.example.querypractice.QueryPostRow">
        SELECT p.id, p.title, b.slug AS board_slug, p.author_id
        FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
        ORDER BY p.id DESC LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="count" resultType="long">
        SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id
        WHERE <include refid="visible"/> <include refid="filters"/>
    </select>
    <select id="exists" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM post p WHERE p.id = #{id} AND <include refid="visible"/>)
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
      "title": "생성한 글 상세 JPA",
      "method": "GET",
      "path": "/api/query-practice/jpa/posts/{{P.body.id}}"
    },
    {
      "id": "B",
      "title": "생성한 글 상세 MyBatis",
      "method": "GET",
      "path": "/api/query-practice/mybatis/posts/{{P.body.id}}"
    },
    {
      "id": "C",
      "title": "게시판 조회",
      "method": "GET",
      "path": "/api/query-practice/jpa/posts?boardSlug=dev"
    },
    {
      "id": "D",
      "title": "작성자 조회",
      "method": "GET",
      "path": "/api/query-practice/mybatis/posts?authorId={{P.body.author.id}}"
    },
    {
      "id": "E",
      "title": "제목 조회",
      "method": "GET",
      "path": "/api/query-practice/jpa/posts?keyword=JPA"
    },
    {
      "id": "F",
      "title": "존재 조회",
      "method": "GET",
      "path": "/api/query-practice/jpa/posts/{{P.body.id}}/exists"
    },
    {
      "id": "G",
      "title": "게시판 수",
      "method": "GET",
      "path": "/api/query-practice/mybatis/count?boardSlug=dev"
    },
    {
      "id": "H",
      "title": "다음 페이지",
      "method": "GET",
      "path": "/api/query-practice/jpa/posts?page=1&size=2"
    },
    {
      "id": "I",
      "title": "운영자 숨김",
      "method": "PATCH",
      "path": "/api/admin/posts/{{P.body.id}}/status",
      "headers": {
        "Authorization": "Bearer tok-p01"
      },
      "body": {
        "status": "HIDDEN"
      }
    },
    {
      "id": "J",
      "title": "숨긴 글 상세",
      "method": "GET",
      "path": "/api/query-practice/jpa/posts/{{P.body.id}}"
    },
    {
      "id": "K",
      "title": "재공개",
      "method": "PATCH",
      "path": "/api/admin/posts/{{P.body.id}}/status",
      "headers": {
        "Authorization": "Bearer tok-p01"
      },
      "body": {
        "status": "PUBLISHED"
      }
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
            "path": "$.id",
            "equals": "{{P.body.id}}"
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "J",
      "expect": {
        "status": 404
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
            "type": "array"
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "D",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "type": "array"
          }
        ]
      }
    },
    {
      "id": "C5",
      "request": "E",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "type": "array"
          }
        ]
      }
    },
    {
      "id": "C6",
      "request": "F",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.exists",
            "equals": true
          }
        ]
      }
    },
    {
      "id": "C7",
      "request": "G",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.count",
            "gte": 1
          }
        ]
      }
    },
    {
      "id": "C8",
      "request": "H",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.page",
            "equals": 1
          },
          {
            "path": "$.size",
            "equals": 2
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
| C1 | 요청 패널 1번째 확인 · 생성 후 상세 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C2 | 요청 패널 2번째 확인 · 숨김·삭제·비공개 제외 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C3 | 요청 패널 3번째 확인 · 게시판 조회 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C4 | 요청 패널 4번째 확인 · 작성자 조회 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C5 | 요청 패널 5번째 확인 · 제목 검색 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C6 | 요청 패널 6번째 확인 · 존재 확인 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C7 | 요청 패널 7번째 확인 · 게시판 글 수 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C8 | 요청 패널 8번째 확인 · 페이지 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
