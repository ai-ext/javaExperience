# L14. 확장 QueryDSL 동적 쿼리

> 최종 본편 16-4 · practice DB에서 연속 실행

## 상황과 개념

L13의 SearchFilter와 같은 게시판 데이터를 재사용합니다. Gradle annotation processor가 QPost를 생성합니다. 필수 공개 조건에 선택 조건을 AND로 추가하고 목록·count에 같은 필터를 씁니다. [OpenFeign QueryDSL](https://github.com/OpenFeign/querydsl).

## 실행 준비

저장소 루트에서 `python3 tools/materialize-query-practice.py --output /tmp/query-practice --through l14-querydsl-extension`를 실행합니다. 처음 L12를 적용할 때 출력 디렉터리는 비어 있어야 합니다. 이후 L13·L14에서 같은 경로로 명령을 다시 실행하면 다음 overlay만 적용됩니다. Java 21로 복원 폴더에서 `./gradlew bootRun --args="--spring.profiles.active=practice"`를 실행합니다. DB 접속은 SPRING_DATASOURCE_URL/SPRING_DATASOURCE_USERNAME/SPRING_DATASOURCE_PASSWORD 환경변수로 조정합니다. L13은 L12 위에, L14는 L12와 L13 위에 적용됩니다.

기존 POST /api/posts에 작성자 토큰과 `{"boardSlug":"dev","title":"쿼리 연습 JPA","content":"본문","tags":["spring"],"visibility":"PUBLIC"}`를 보내 201 응답의 id를 받으세요. 같은 DB에서 이 id를 아래 {id}로 사용합니다. 새 API는 공개 데이터 비교용이며 개인별 권한은 기존 API에서 확인합니다.

## 순서대로 구현할 시나리오

### Q15. Q 생성·게시판

- 요청: `GET /api/query-practice/querydsl/search?boardSlug=dev`
- 조건: board.slug=dev
- QueryDSL: `QPost.board.slug.eq`
- MyBatis/SQL: `JOIN board`
- 기대: 세 엔진 일치
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q15 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · QuerydslQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/querydsl")
public class QuerydslQueryController {
    private final QuerydslQueryService service;
    public QuerydslQueryController(QuerydslQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@RequestParam Map<String, String> params) {
        return service.search(params);
    }
}
```

**Service · QuerydslQueryService.java**

```java
package org.example.querypractice;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class QuerydslQueryService {
    private final QuerydslPostRepository repository;

    public QuerydslQueryService(QuerydslPostRepository repository) {
        this.repository = repository;
    }

    public QueryPage search(Map<String, String> params) {
        return repository.search(SearchFilter.parse(params));
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

**QueryDSL Repository · QuerydslPostRepository.java**

```java
package org.example.querypractice;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.example.post.QPost;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public class QuerydslPostRepository {
    private final JPAQueryFactory query;
    public QuerydslPostRepository(EntityManager em) { this.query = new JPAQueryFactory(em); }

    public QueryPage search(SearchFilter filter) {
        QPost p = QPost.post;
        BooleanBuilder where = new BooleanBuilder(p.deletedAt.isNull().and(p.hiddenAt.isNull())
                .and(p.status.eq("PUBLISHED")).and(p.visibility.eq("PUBLIC")));
        if (filter.boardSlug() != null) where.and(p.board.slug.eq(filter.boardSlug()));
        if (filter.authorId() != null) where.and(p.author.id.eq(filter.authorId()));
        if (filter.pattern() != null) {
            // 공개 조건 AND (제목 OR 본문)으로 묶어야 숨김 글이 OR 뒤로 새지 않는다.
            // 패턴도 DB LOWER로 변환한다. Java Locale.ROOT는 İ 같은 문자를 MySQL LOWER와 다르게 변환한다.
            var pattern = Expressions.stringTemplate("lower({0})", Expressions.constant(filter.pattern()));
            where.and(p.title.lower().like(pattern, '!').or(p.content.lower().like(pattern, '!')));
        }
        if (filter.tag() != null) where.and(p.tags.any().name.eq(filter.tag()));
        if (filter.from() != null) where.and(p.createdAt.goe(filter.from()));
        if (filter.to() != null) where.and(p.createdAt.lt(filter.to()));
        var rows = query.select(Projections.constructor(QueryPostRow.class, p.id, p.title, p.board.slug, p.author.id))
                .from(p).where(where);
        if (filter.sort().equals("likes")) rows.orderBy(p.likeCount.desc(), p.id.desc());
        else rows.orderBy(p.id.desc());
        var items = rows.offset(filter.offset()).limit(filter.size()).fetch();
        Long total = query.select(p.id.count()).from(p).where(where).fetchOne();
        return new QueryPage(items, filter.page(), filter.size(), total == null ? 0 : total);
    }
}
```

**MyBatis 확장편 비교 · DeclaredPostMapper.xml**

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


### Q16. 필수 AND 선택 OR

- 요청: `GET /api/query-practice/querydsl/search?keyword=JPA`
- 조건: 공개 AND (제목 OR 본문)
- QueryDSL: `BooleanBuilder.and(or(...))`
- MyBatis/SQL: `괄호 LIKE`
- 기대: 숨김 제외
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q16 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · QuerydslQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/querydsl")
public class QuerydslQueryController {
    private final QuerydslQueryService service;
    public QuerydslQueryController(QuerydslQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@RequestParam Map<String, String> params) {
        return service.search(params);
    }
}
```

**Service · QuerydslQueryService.java**

```java
package org.example.querypractice;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class QuerydslQueryService {
    private final QuerydslPostRepository repository;

    public QuerydslQueryService(QuerydslPostRepository repository) {
        this.repository = repository;
    }

    public QueryPage search(Map<String, String> params) {
        return repository.search(SearchFilter.parse(params));
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

**QueryDSL Repository · QuerydslPostRepository.java**

```java
package org.example.querypractice;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.example.post.QPost;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public class QuerydslPostRepository {
    private final JPAQueryFactory query;
    public QuerydslPostRepository(EntityManager em) { this.query = new JPAQueryFactory(em); }

    public QueryPage search(SearchFilter filter) {
        QPost p = QPost.post;
        BooleanBuilder where = new BooleanBuilder(p.deletedAt.isNull().and(p.hiddenAt.isNull())
                .and(p.status.eq("PUBLISHED")).and(p.visibility.eq("PUBLIC")));
        if (filter.boardSlug() != null) where.and(p.board.slug.eq(filter.boardSlug()));
        if (filter.authorId() != null) where.and(p.author.id.eq(filter.authorId()));
        if (filter.pattern() != null) {
            // 공개 조건 AND (제목 OR 본문)으로 묶어야 숨김 글이 OR 뒤로 새지 않는다.
            // 패턴도 DB LOWER로 변환한다. Java Locale.ROOT는 İ 같은 문자를 MySQL LOWER와 다르게 변환한다.
            var pattern = Expressions.stringTemplate("lower({0})", Expressions.constant(filter.pattern()));
            where.and(p.title.lower().like(pattern, '!').or(p.content.lower().like(pattern, '!')));
        }
        if (filter.tag() != null) where.and(p.tags.any().name.eq(filter.tag()));
        if (filter.from() != null) where.and(p.createdAt.goe(filter.from()));
        if (filter.to() != null) where.and(p.createdAt.lt(filter.to()));
        var rows = query.select(Projections.constructor(QueryPostRow.class, p.id, p.title, p.board.slug, p.author.id))
                .from(p).where(where);
        if (filter.sort().equals("likes")) rows.orderBy(p.likeCount.desc(), p.id.desc());
        else rows.orderBy(p.id.desc());
        var items = rows.offset(filter.offset()).limit(filter.size()).fetch();
        Long total = query.select(p.id.count()).from(p).where(where).fetchOne();
        return new QueryPage(items, filter.page(), filter.size(), total == null ? 0 : total);
    }
}
```

**MyBatis 확장편 비교 · DeclaredPostMapper.xml**

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


### Q17. 태그 중복 방지

- 요청: `GET /api/query-practice/querydsl/search?tag=spring`
- 조건: tags.name=spring
- QueryDSL: `p.tags.any().name.eq`
- MyBatis/SQL: `관계 EXISTS`
- 기대: 한 글 한 번
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q17 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · QuerydslQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/querydsl")
public class QuerydslQueryController {
    private final QuerydslQueryService service;
    public QuerydslQueryController(QuerydslQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@RequestParam Map<String, String> params) {
        return service.search(params);
    }
}
```

**Service · QuerydslQueryService.java**

```java
package org.example.querypractice;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class QuerydslQueryService {
    private final QuerydslPostRepository repository;

    public QuerydslQueryService(QuerydslPostRepository repository) {
        this.repository = repository;
    }

    public QueryPage search(Map<String, String> params) {
        return repository.search(SearchFilter.parse(params));
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

**QueryDSL Repository · QuerydslPostRepository.java**

```java
package org.example.querypractice;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.example.post.QPost;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public class QuerydslPostRepository {
    private final JPAQueryFactory query;
    public QuerydslPostRepository(EntityManager em) { this.query = new JPAQueryFactory(em); }

    public QueryPage search(SearchFilter filter) {
        QPost p = QPost.post;
        BooleanBuilder where = new BooleanBuilder(p.deletedAt.isNull().and(p.hiddenAt.isNull())
                .and(p.status.eq("PUBLISHED")).and(p.visibility.eq("PUBLIC")));
        if (filter.boardSlug() != null) where.and(p.board.slug.eq(filter.boardSlug()));
        if (filter.authorId() != null) where.and(p.author.id.eq(filter.authorId()));
        if (filter.pattern() != null) {
            // 공개 조건 AND (제목 OR 본문)으로 묶어야 숨김 글이 OR 뒤로 새지 않는다.
            // 패턴도 DB LOWER로 변환한다. Java Locale.ROOT는 İ 같은 문자를 MySQL LOWER와 다르게 변환한다.
            var pattern = Expressions.stringTemplate("lower({0})", Expressions.constant(filter.pattern()));
            where.and(p.title.lower().like(pattern, '!').or(p.content.lower().like(pattern, '!')));
        }
        if (filter.tag() != null) where.and(p.tags.any().name.eq(filter.tag()));
        if (filter.from() != null) where.and(p.createdAt.goe(filter.from()));
        if (filter.to() != null) where.and(p.createdAt.lt(filter.to()));
        var rows = query.select(Projections.constructor(QueryPostRow.class, p.id, p.title, p.board.slug, p.author.id))
                .from(p).where(where);
        if (filter.sort().equals("likes")) rows.orderBy(p.likeCount.desc(), p.id.desc());
        else rows.orderBy(p.id.desc());
        var items = rows.offset(filter.offset()).limit(filter.size()).fetch();
        Long total = query.select(p.id.count()).from(p).where(where).fetchOne();
        return new QueryPage(items, filter.page(), filter.size(), total == null ? 0 : total);
    }
}
```

**MyBatis 확장편 비교 · DeclaredPostMapper.xml**

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


### Q18. 페이지·count

- 요청: `GET /api/query-practice/querydsl/search?sort=likes&page=0&size=5`
- 조건: 좋아요 DESC,id DESC
- QueryDSL: `orderBy/offset/limit/count`
- MyBatis/SQL: `ORDER BY/LIMIT/COUNT`
- 기대: L13과 일치
- 연결: 앞서 만든 같은 게시글 id를 쓰고 기존 API에서 상태를 바꾼 뒤 재조회합니다.

<details><summary>Q18 구현 코드 — Controller · Service · DTO · Repository · Mapper</summary>

이 시나리오에서 사용하는 실행 파일 전문입니다. 여러 시나리오가 같은 클래스를 이어 확장하므로 공통 메서드도 함께 표시합니다.

**Controller · QuerydslQueryController.java**

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/querydsl")
public class QuerydslQueryController {
    private final QuerydslQueryService service;
    public QuerydslQueryController(QuerydslQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@RequestParam Map<String, String> params) {
        return service.search(params);
    }
}
```

**Service · QuerydslQueryService.java**

```java
package org.example.querypractice;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class QuerydslQueryService {
    private final QuerydslPostRepository repository;

    public QuerydslQueryService(QuerydslPostRepository repository) {
        this.repository = repository;
    }

    public QueryPage search(Map<String, String> params) {
        return repository.search(SearchFilter.parse(params));
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

**QueryDSL Repository · QuerydslPostRepository.java**

```java
package org.example.querypractice;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.example.post.QPost;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public class QuerydslPostRepository {
    private final JPAQueryFactory query;
    public QuerydslPostRepository(EntityManager em) { this.query = new JPAQueryFactory(em); }

    public QueryPage search(SearchFilter filter) {
        QPost p = QPost.post;
        BooleanBuilder where = new BooleanBuilder(p.deletedAt.isNull().and(p.hiddenAt.isNull())
                .and(p.status.eq("PUBLISHED")).and(p.visibility.eq("PUBLIC")));
        if (filter.boardSlug() != null) where.and(p.board.slug.eq(filter.boardSlug()));
        if (filter.authorId() != null) where.and(p.author.id.eq(filter.authorId()));
        if (filter.pattern() != null) {
            // 공개 조건 AND (제목 OR 본문)으로 묶어야 숨김 글이 OR 뒤로 새지 않는다.
            // 패턴도 DB LOWER로 변환한다. Java Locale.ROOT는 İ 같은 문자를 MySQL LOWER와 다르게 변환한다.
            var pattern = Expressions.stringTemplate("lower({0})", Expressions.constant(filter.pattern()));
            where.and(p.title.lower().like(pattern, '!').or(p.content.lower().like(pattern, '!')));
        }
        if (filter.tag() != null) where.and(p.tags.any().name.eq(filter.tag()));
        if (filter.from() != null) where.and(p.createdAt.goe(filter.from()));
        if (filter.to() != null) where.and(p.createdAt.lt(filter.to()));
        var rows = query.select(Projections.constructor(QueryPostRow.class, p.id, p.title, p.board.slug, p.author.id))
                .from(p).where(where);
        if (filter.sort().equals("likes")) rows.orderBy(p.likeCount.desc(), p.id.desc());
        else rows.orderBy(p.id.desc());
        var items = rows.offset(filter.offset()).limit(filter.size()).fetch();
        Long total = query.select(p.id.count()).from(p).where(where).fetchOne();
        return new QueryPage(items, filter.page(), filter.size(), total == null ? 0 : total);
    }
}
```

**MyBatis 확장편 비교 · DeclaredPostMapper.xml**

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
    // 같은 계열의 런타임·APT를 고정한다. Q 타입은 compileJava가 생성한다.
    implementation 'io.github.openfeign.querydsl:querydsl-jpa:7.7'
    annotationProcessor 'io.github.openfeign.querydsl:querydsl-apt:7.7:jpa'
    annotationProcessor 'jakarta.persistence:jakarta.persistence-api'
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

<details><summary>Service · QuerydslQueryService.java</summary>

`src/main/java/org/example/querypractice/QuerydslQueryService.java`

```java
package org.example.querypractice;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class QuerydslQueryService {
    private final QuerydslPostRepository repository;

    public QuerydslQueryService(QuerydslPostRepository repository) {
        this.repository = repository;
    }

    public QueryPage search(Map<String, String> params) {
        return repository.search(SearchFilter.parse(params));
    }
}
```

</details>

<details><summary>Repository · QuerydslPostRepository.java</summary>

`src/main/java/org/example/querypractice/QuerydslPostRepository.java`

```java
package org.example.querypractice;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.example.post.QPost;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public class QuerydslPostRepository {
    private final JPAQueryFactory query;
    public QuerydslPostRepository(EntityManager em) { this.query = new JPAQueryFactory(em); }

    public QueryPage search(SearchFilter filter) {
        QPost p = QPost.post;
        BooleanBuilder where = new BooleanBuilder(p.deletedAt.isNull().and(p.hiddenAt.isNull())
                .and(p.status.eq("PUBLISHED")).and(p.visibility.eq("PUBLIC")));
        if (filter.boardSlug() != null) where.and(p.board.slug.eq(filter.boardSlug()));
        if (filter.authorId() != null) where.and(p.author.id.eq(filter.authorId()));
        if (filter.pattern() != null) {
            // 공개 조건 AND (제목 OR 본문)으로 묶어야 숨김 글이 OR 뒤로 새지 않는다.
            // 패턴도 DB LOWER로 변환한다. Java Locale.ROOT는 İ 같은 문자를 MySQL LOWER와 다르게 변환한다.
            var pattern = Expressions.stringTemplate("lower({0})", Expressions.constant(filter.pattern()));
            where.and(p.title.lower().like(pattern, '!').or(p.content.lower().like(pattern, '!')));
        }
        if (filter.tag() != null) where.and(p.tags.any().name.eq(filter.tag()));
        if (filter.from() != null) where.and(p.createdAt.goe(filter.from()));
        if (filter.to() != null) where.and(p.createdAt.lt(filter.to()));
        var rows = query.select(Projections.constructor(QueryPostRow.class, p.id, p.title, p.board.slug, p.author.id))
                .from(p).where(where);
        if (filter.sort().equals("likes")) rows.orderBy(p.likeCount.desc(), p.id.desc());
        else rows.orderBy(p.id.desc());
        var items = rows.offset(filter.offset()).limit(filter.size()).fetch();
        Long total = query.select(p.id.count()).from(p).where(where).fetchOne();
        return new QueryPage(items, filter.page(), filter.size(), total == null ? 0 : total);
    }
}
```

</details>

<details><summary>Controller · QuerydslQueryController.java</summary>

`src/main/java/org/example/querypractice/QuerydslQueryController.java`

```java
package org.example.querypractice;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Profile("practice")
@RestController
@RequestMapping("/api/query-practice/querydsl")
public class QuerydslQueryController {
    private final QuerydslQueryService service;
    public QuerydslQueryController(QuerydslQueryService service) { this.service = service; }
    @GetMapping("/search")
    public QueryPage search(@RequestParam Map<String, String> params) {
        return service.search(params);
    }
}
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
      "title": "QueryDSL 게시판",
      "method": "GET",
      "path": "/api/query-practice/querydsl/search?boardSlug=dev"
    },
    {
      "id": "B",
      "title": "JPA 게시판",
      "method": "GET",
      "path": "/api/query-practice/jpa/search?boardSlug=dev"
    },
    {
      "id": "C",
      "title": "QueryDSL OR",
      "method": "GET",
      "path": "/api/query-practice/querydsl/search?keyword=JPA"
    },
    {
      "id": "D",
      "title": "JPA OR",
      "method": "GET",
      "path": "/api/query-practice/jpa/search?keyword=JPA"
    },
    {
      "id": "E",
      "title": "QueryDSL 태그",
      "method": "GET",
      "path": "/api/query-practice/querydsl/search?tag=spring"
    },
    {
      "id": "F",
      "title": "JPA 태그",
      "method": "GET",
      "path": "/api/query-practice/jpa/search?tag=spring"
    },
    {
      "id": "G",
      "title": "QueryDSL 페이지",
      "method": "GET",
      "path": "/api/query-practice/querydsl/search?sort=likes&page=0&size=3"
    },
    {
      "id": "H",
      "title": "MyBatis 페이지",
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
      "id": "C3",
      "request": "E",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "equals": "{{F.body.items}}"
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "G",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "equals": "{{H.body.items}}"
          },
          {
            "path": "$.total",
            "equals": "{{H.body.total}}"
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
| C1 | 요청 패널 1번째 확인 · Q 생성·게시판 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C2 | 요청 패널 2번째 확인 · 필수 AND 선택 OR | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C3 | 요청 패널 3번째 확인 · 태그 중복 방지 | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
| C4 | 요청 패널 4번째 확인 · 페이지·count | 생성 응답 ID와 같은 게시글에 대해 명세의 조건·응답을 확인 |
