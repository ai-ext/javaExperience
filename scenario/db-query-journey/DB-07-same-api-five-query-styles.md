# DB-07. 같은 목록 API를 다섯 방식으로 조회하기 — 중급

<style>
main:has(.db07-visual){max-width:1600px}
.db07-visual{--ink:var(--fg);--blue:var(--accent);--cyan:var(--syntax-string);color:var(--fg);margin:10px 0 22px}
.db07-visual *{box-sizing:border-box}
.db07-visual .db07-contract{display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:11px 14px;border:1px solid var(--line);border-radius:13px;background:linear-gradient(100deg,var(--card),var(--card) 55%,var(--card));color:var(--accent)}
.db07-visual .db07-method{padding:5px 9px;border-radius:7px;background:var(--card);color:var(--syntax-string);font-size:.74rem;font-weight:900;letter-spacing:.04em}
.db07-visual .db07-path{font:800 .84rem/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
.db07-visual .db07-contract small{margin-left:auto;color:var(--muted);font-size:.71rem}
.db07-visual .db07-caption{margin:9px 2px 12px;color:var(--accent);font-size:.82rem;line-height:1.5}
.db07-visual .db07-common{display:grid;grid-template-columns:minmax(0,.8fr) 30px minmax(0,.8fr) 30px minmax(0,.8fr);align-items:stretch;gap:8px;margin:14px 0 12px}
.db07-visual .db07-node{position:relative;min-width:0;padding:12px;border:1px solid var(--line);border-radius:13px;background:linear-gradient(145deg,var(--card),var(--card));box-shadow:0 5px 14px transparent}
.db07-visual .db07-nodehead{display:flex;align-items:center;gap:8px;margin-bottom:5px;color:var(--ink);font-size:.81rem;font-weight:900}
.db07-visual .db07-icon{display:grid;width:28px;height:28px;flex:0 0 28px;place-items:center;border-radius:9px;background:var(--card);color:var(--accent);font-size:.8rem;font-weight:950}
.db07-visual .db07-node p{margin:0;color:var(--muted);font-size:.72rem;line-height:1.45}
.db07-visual .db07-arrow{display:grid;place-items:center;color:var(--accent);font-size:1.35rem;font-weight:900;animation:db07-pulse 1.7s ease-in-out infinite}
.db07-visual .db07-branch-title{display:flex;align-items:center;gap:8px;margin:17px 0 9px;color:var(--fg);font-size:.9rem;font-weight:900}
.db07-visual .db07-branch-title:after{height:1px;flex:1;content:"";background:linear-gradient(90deg,var(--accent-soft),transparent)}
.db07-visual .db07-branches{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;align-items:stretch}
.db07-visual .db07-branch{position:relative;min-width:0;min-height:130px;padding:11px 10px;border:1px solid var(--line);border-radius:13px;background:linear-gradient(145deg,var(--code-bg),var(--code-bg));box-shadow:0 8px 18px transparent;color:var(--fg)}
.db07-visual .db07-branch:before{position:absolute;top:-9px;left:50%;width:2px;height:8px;content:"";background:var(--accent-soft);box-shadow:0 0 7px transparent;transform:translateX(-50%)}
.db07-visual .db07-branchhead{display:flex;align-items:center;gap:7px;margin-bottom:7px;font-size:.75rem;font-weight:900}
.db07-visual .db07-num{display:grid;width:21px;height:21px;flex:0 0 21px;place-items:center;border-radius:7px;background:var(--accent-soft);color:var(--fg);font-size:.68rem}
.db07-visual .db07-branch:nth-child(2) .db07-num{background:var(--accent-soft)}.db07-visual .db07-branch:nth-child(3) .db07-num{background:var(--accent-soft)}.db07-visual .db07-branch:nth-child(4) .db07-num{background:var(--accent-soft)}.db07-visual .db07-branch:nth-child(5) .db07-num{background:var(--accent-soft)}
.db07-visual .db07-branch p{margin:0 0 7px;color:var(--accent);font-size:.67rem;line-height:1.4}
.db07-visual .db07-branch code{display:block;padding:5px 6px;border:1px solid var(--line);border-radius:7px;background:var(--code-bg);color:var(--accent);font-size:.62rem;line-height:1.35;overflow-wrap:anywhere}
.db07-visual .db07-branchout{display:flex;align-items:center;justify-content:center;gap:8px;margin:9px 0 0;color:var(--accent);font-size:.72rem;font-weight:850}
.db07-visual .db07-branchout:before,.db07-visual .db07-branchout:after{height:1px;flex:1;content:"";background:linear-gradient(90deg,var(--accent-soft),var(--accent-soft))}
.db07-visual .db07-sql-engine{display:grid;grid-template-columns:minmax(0,1.1fr) 34px minmax(0,.9fr) 34px minmax(0,.9fr);align-items:stretch;gap:8px;margin:12px 0}
.db07-visual .db07-engine{display:flex;align-items:center;gap:9px;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:linear-gradient(110deg,var(--card),var(--card));color:var(--accent)}
.db07-visual .db07-engine.db07-db{border-color:var(--line);background:linear-gradient(110deg,var(--card),var(--card))}
.db07-visual .db07-engine.db07-result{border-color:var(--line);background:linear-gradient(110deg,var(--card),var(--card))}
.db07-visual .db07-engine b{display:block;font-size:.74rem}.db07-visual .db07-engine small{display:block;margin-top:2px;color:var(--muted);font-size:.64rem;line-height:1.35}
.db07-visual .db07-engine-icon{display:grid;width:30px;height:30px;flex:0 0 30px;place-items:center;border-radius:9px;background:var(--card);color:var(--accent);font-size:.8rem;font-weight:950}
.db07-visual .db07-db .db07-engine-icon{background:var(--card);color:var(--accent)}.db07-visual .db07-result .db07-engine-icon{background:var(--card);color:var(--accent)}
.db07-visual .db07-runtime{display:grid;gap:6px;min-width:0}
.db07-visual .db07-runtime-lane{display:grid;grid-template-columns:88px minmax(0,1fr);align-items:center;gap:7px;padding:6px 8px;border:1px solid var(--line);border-radius:9px;background:var(--card);color:var(--accent)}
.db07-visual .db07-runtime-lane b{font-size:.64rem}.db07-visual .db07-runtime-lane small{margin:0;font-size:.59rem}
.db07-visual .db07-rolekey{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.db07-visual .db07-rolekey span{padding:4px 7px;border:1px solid var(--line);border-radius:7px;background:var(--card);color:var(--muted);font-size:.63rem}
.db07-visual .db07-rolekey b{color:var(--accent)}
@keyframes db07-pulse{50%{opacity:.52;filter:drop-shadow(0 0 4px transparent)}}
@media(prefers-reduced-motion:reduce){.db07-visual .db07-arrow{animation:none}}
@media(max-width:1000px){.db07-visual .db07-branches{grid-template-columns:repeat(3,minmax(0,1fr))}.db07-visual .db07-branch:nth-child(n+4):before{display:none}}
@media(max-width:650px){.db07-visual .db07-common{grid-template-columns:1fr;gap:4px}.db07-visual .db07-arrow{height:18px;font-size:1rem;transform:rotate(90deg)}.db07-visual .db07-branches{grid-template-columns:1fr;gap:8px}.db07-visual .db07-branch{min-height:0;padding:10px 11px}.db07-visual .db07-branch:before{top:-8px;left:14px}.db07-visual .db07-branch:nth-child(n+4):before{display:none}.db07-visual .db07-branchout{margin:7px 0}.db07-visual .db07-sql-engine{grid-template-columns:1fr;gap:4px}.db07-visual .db07-engine-arrow{height:16px;transform:rotate(90deg)}.db07-visual .db07-engine{align-items:flex-start}.db07-visual .db07-runtime-lane{grid-template-columns:76px minmax(0,1fr)}.db07-visual .db07-contract small{width:100%;margin-left:0}.db07-visual .db07-path{font-size:.72rem}}
</style>

<section class="db07-visual" aria-label="같은 API 요청이 다섯 쿼리 방식으로 구현되어 MySQL에서 같은 응답으로 합쳐지는 흐름">
  <div class="db07-contract"><span class="db07-method">GET</span><span class="db07-path">/api/boards/dev/posts?size=20&amp;cursor=</span><small>M1 · 비로그인 첫 페이지 · 연습 계약</small></div>
  <p class="db07-caption">한 요청을 받아 Service까지는 같은 경로로 흐릅니다. Service 아래에서 <strong>한 가지 방식만 선택</strong>해 조회하고, 저장소 종류와 관계없이 같은 결과 모양으로 돌아옵니다.</p>
  <div class="db07-common" aria-label="공통 요청 흐름">
    <div class="db07-node"><div class="db07-nodehead"><span class="db07-icon" aria-hidden="true">↗</span>① 브라우저 요청</div><p><code>slug=dev</code> · <code>size=20</code><br>빈 cursor · 비로그인</p></div>
    <div class="db07-arrow" aria-hidden="true">→</div>
    <div class="db07-node"><div class="db07-nodehead"><span class="db07-icon" aria-hidden="true">⌘</span>② Controller</div><p>path·query parameter를 읽어 Service 호출</p></div>
    <div class="db07-arrow" aria-hidden="true">→</div>
    <div class="db07-node"><div class="db07-nodehead"><span class="db07-icon" aria-hidden="true">⚙</span>③ Service</div><p>공개 규칙·페이지 크기를 정하고 조회 방식을 선택</p></div>
  </div>
  <div class="db07-branch-title">④ 같은 조건을 표현하는 다섯 쿼리 방식 · 요청마다 하나를 선택</div>
  <div class="db07-branches" aria-label="서로 대체 관계인 다섯 쿼리 구현">
    <article class="db07-branch"><div class="db07-branchhead"><span class="db07-num">1</span>파생 메서드</div><p>메서드 이름에서 조건 읽기</p><code>findTop20By…OrderBy…</code></article>
    <article class="db07-branch"><div class="db07-branchhead"><span class="db07-num">2</span>JPQL @Query</div><p>엔티티·Java 속성으로 조회</p><code>p.board.slug · p.deletedAt</code></article>
    <article class="db07-branch"><div class="db07-branchhead"><span class="db07-num">3</span>Native SQL</div><p>테이블·열 이름을 직접 작성</p><code>board · post.board_id</code></article>
    <article class="db07-branch"><div class="db07-branchhead"><span class="db07-num">4</span>MyBatis XML</div><p>Mapper가 작성된 SQL 실행</p><code>PostListMapper.xml</code></article>
    <article class="db07-branch"><div class="db07-branchhead"><span class="db07-num">5</span>QueryDSL</div><p>Java 코드로 조건을 조립</p><code>p.board.slug.eq("dev")</code></article>
  </div>
  <div class="db07-branchout" aria-hidden="true">각 방식이 만든 조회가 SQL 실행으로 합류</div>
  <div class="db07-sql-engine" aria-label="각 구현의 실행 경로가 MySQL에서 합쳐져 응답으로 돌아오는 흐름">
    <div class="db07-engine"><span><b>⑤ SQL 실행 경로</b><span class="db07-runtime"><span class="db07-runtime-lane"><b>JPA 계열</b><small>Hibernate가 SQL 생성·실행 (native SQL은 전달)</small></span><span class="db07-runtime-lane"><b>MyBatis</b><small>Mapper SQL을 JDBC로 실행</small></span></span></span></div>
    <div class="db07-arrow db07-engine-arrow" aria-hidden="true">→</div>
    <div class="db07-engine db07-db"><span class="db07-engine-icon" aria-hidden="true">▤</span><span><b>MySQL · practice</b><small>WHERE · JOIN · ORDER BY · LIMIT 적용</small></span></div>
    <div class="db07-arrow db07-engine-arrow" aria-hidden="true">→</div>
    <div class="db07-engine db07-result"><span class="db07-engine-icon" aria-hidden="true">{ }</span><span><b>DTO → 같은 JSON</b><small>태그는 페이지 ID로 모아 일괄 조회</small></span></div>
  </div>
  <div class="db07-rolekey" aria-label="계층 역할"><span><b>Controller</b> 요청 받기</span><span><b>Service</b> 규칙·조율</span><span><b>Repository / Mapper</b> 조회</span><span><b>MySQL</b> 행 저장</span><span><b>DTO</b> 응답 모양</span></div>
</section>

## 지금 보는 계약

`GET /api/boards/dev/posts?size=20&cursor=`는 M1의 **비로그인 첫 페이지** 계약입니다. 응답에는 `id`, `title`, `authorNickname`, `likeCount`, `commentCount`, `tags[]`, `publishedAt`이 있고 `content`는 없습니다. `PUBLISHED`, 미삭제, `PUBLIC` 글을 `publishedAt DESC, id DESC`로 정렬합니다. 시드에서 확인한 첫 5개 ID는 `145, 144, 143, 140, 138`입니다.

**상태 표시:** M1은 요구사항과 기대값이 정해진 미션입니다. 현재 저장소 루트 앱은 `/hello`만 구현되어 있고 이 목록 API는 아직 없습니다. 아래 코드는 L12–L14 복원 실습에서 사용하는 스키마·도메인 경로를 바탕으로 한 구현 조각입니다. 현재 루트 앱에 붙여 넣으면 바로 컴파일되는 완성 기능이라고 주장하지 않습니다.

공통 SQL의 핵심은 다음과 같습니다. 태그까지 한 번에 JOIN하면 게시글 한 건이 태그 개수만큼 늘어나므로, 페이지의 글을 먼저 고르고 `post_tag`와 `tag`는 페이지의 ID를 모아 별도 일괄 조회합니다.

```sql
SELECT p.id, p.title, m.nickname AS author_nickname,
       p.like_count, p.comment_count, p.published_at
FROM board b
JOIN post p ON p.board_id = b.id
JOIN member m ON m.id = p.author_id
WHERE b.slug = 'dev'
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
  AND p.visibility = 'PUBLIC'
ORDER BY p.published_at DESC, p.id DESC
LIMIT 20;
```

## 방식별 코드는 필요할 때 펼치기

각 예시는 **같은 WHERE와 순서**를 표현합니다. 결과 DTO와 태그 일괄 조회는 공통 단계입니다. 코드 조각은 쿼리 차이를 비교하기 위한 것이며, 클래스 전체·프로젝트 설정은 각 링크의 실행 가능한 실습본에서 확인합니다.

<details>
<summary>① 파생 메서드 — 조건과 정렬이 단순할 때</summary>

**Repository · `PostListRepository.java`**

```java
List<Post> findTop20ByBoard_SlugAndStatusAndDeletedAtIsNullAndVisibilityOrderByPublishedAtDescIdDesc(
        String boardSlug, String status, String visibility);
```

Service는 `"dev"`, `"PUBLISHED"`, `"PUBLIC"`을 넘깁니다. `Board_Slug`는 `Post.board.slug` 경로이고 `IsNull`은 `deletedAt IS NULL` 조건입니다. Spring Data가 이름을 분석해 쿼리를 만듭니다.

**한계:** 이 이름만으로 응답의 `authorNickname`, 저장 카운트, `tags[]`를 원하는 모양의 한 DTO로 투영하지는 않습니다. 엔티티를 받은 뒤 작성자를 읽으면 지연 로딩 SQL이 추가될 수 있습니다. Fetch 전략을 확인하고, 페이지의 태그는 별도 일괄 조회하세요. `Top20`은 고정 상한이라 요청 `size`와 커서 페이지를 그대로 표현할 수 없습니다. 연습에서는 첫 페이지 20개만 비교합니다.

</details>

<details>
<summary>② JPQL @Query — Java 엔티티 경로와 DTO 프로젝션</summary>

**DTO · `PostListRow.java`**

```java
public record PostListRow(Long id, String title, String authorNickname,
                          Integer likeCount, Integer commentCount, LocalDateTime publishedAt) {}
```

**Repository · `PostListRepository.java`**

```java
@Query("""
    select new org.example.post.PostListRow(
        p.id, p.title, m.nickname, p.likeCount, p.commentCount, p.publishedAt)
    from Post p join p.board b join p.author m
    where b.slug = :slug
      and p.status = 'PUBLISHED'
      and p.deletedAt is null
      and p.visibility = 'PUBLIC'
    order by p.publishedAt desc, p.id desc
    """)
List<PostListRow> firstPage(@Param("slug") String slug, Pageable pageable);
```

JPQL은 `post`, `board_id` 같은 SQL 이름 대신 `Post`, `p.board`, `p.deletedAt` 같은 엔티티와 Java 속성을 씁니다. DB-01 첫 페이지에서는 `PageRequest.of(0, 20)`을 전달할 수 있습니다. `Page`가 필요하면 전체 개수용 count query가 추가될 수 있으므로 SQL 로그로 호출 수를 확인합니다. 실제 API의 opaque cursor 계약은 offset `Pageable`로 대체할 수 없습니다.

`tags[]`는 생성자 프로젝션에 억지로 collection JOIN하지 않습니다. `pageRows.map(PostListRow::id)`로 ID를 모아 `WHERE pt.post_id IN (:ids)` 형태의 두 번째 조회를 하고 DTO에 붙입니다.

</details>

<details>
<summary>③ JPQL의 명시적 @Query와 native SQL — ORM 언어와 DB 언어 구분</summary>

위 ②의 `@Query`가 JPQL입니다. 어노테이션이 붙어 있어도 SQL이 아니라 **JPQL**이라는 점이 포인트입니다. 같은 Repository에 네이티브 SQL을 선언하면 테이블과 실제 열 이름을 직접 씁니다.

**Repository · native query 조각**

```java
@Query(value = """
    SELECT p.id AS id, p.title AS title, m.nickname AS authorNickname,
           p.like_count AS likeCount, p.comment_count AS commentCount,
           p.published_at AS publishedAt
    FROM board b
    JOIN post p ON p.board_id = b.id
    JOIN member m ON m.id = p.author_id
    WHERE b.slug = :slug AND p.status = 'PUBLISHED'
      AND p.deleted_at IS NULL AND p.visibility = 'PUBLIC'
    ORDER BY p.published_at DESC, p.id DESC
    LIMIT 20
    """, nativeQuery = true)
List<PostListProjection> firstPageNative(@Param("slug") String slug);
```

`PostListProjection`은 `getId()`, `getTitle()`, `getAuthorNickname()` 등 alias에 대응하는 getter를 둔 interface projection입니다. native 결과 매핑은 alias와 provider 동작을 통합 테스트로 확인하세요. 복합 DTO나 DB별 타입을 매핑할 땐 `@SqlResultSetMapping` 또는 명시적인 JDBC 매핑이 더 분명할 수 있습니다. 태그 일괄 조회는 동일하게 별도 수행합니다.

JPQL은 엔티티 모델 중심이고, native SQL은 MySQL 문법·실행계획을 세밀하게 다룰 수 있습니다. native SQL을 택해도 바인딩 파라미터를 쓰고, 사용자 입력을 문자열로 이어 붙이지 않습니다.

</details>

<details>
<summary>④ MyBatis XML — SQL을 그대로 읽고 수정하기</summary>

**Mapper · `PostListMapper.java`**

```java
List<PostListRow> findFirstPage(@Param("slug") String slug);
```

**Mapper XML · `PostListMapper.xml`**

```xml
<select id="findFirstPage" resultType="org.example.post.PostListRow">
  SELECT p.id, p.title, m.nickname AS authorNickname,
         p.like_count AS likeCount, p.comment_count AS commentCount,
         p.published_at AS publishedAt
  FROM board b
  JOIN post p ON p.board_id = b.id
  JOIN member m ON m.id = p.author_id
  WHERE b.slug = #{slug}
    AND p.status = 'PUBLISHED'
    AND p.deleted_at IS NULL
    AND p.visibility = 'PUBLIC'
  ORDER BY p.published_at DESC, p.id DESC
  LIMIT 20
</select>
```

`#{slug}`은 값 바인딩입니다. `${slug}`로 바꾸면 값이 SQL 텍스트에 삽입되므로 사용자 입력에 사용하지 않습니다. 프로젝트의 기존 L13 XML은 `resultType`과 underscore-to-camel 설정을 사용하는 예가 있습니다. 이 예시의 별칭은 DTO Java 이름과 맞춘 것입니다. `tags[]`는 두 번째 Mapper 메서드에서 페이지 ID들을 `<foreach>`로 바인딩해 일괄 조회합니다.

MyBatis는 SQL 생성기를 숨기지 않습니다. XML을 열면 실제 SELECT와 JOIN을 읽을 수 있지만, 조건·정렬·페이지 제한의 일관성을 직접 유지해야 합니다.

</details>

<details>
<summary>⑤ QueryDSL — 조건을 Java 코드로 조립하기</summary>

**Repository · `PostListRepositoryCustomImpl.java`의 핵심**

```java
QPost p = QPost.post;
BooleanBuilder where = new BooleanBuilder()
        .and(p.board.slug.eq("dev"))
        .and(p.status.eq("PUBLISHED"))
        .and(p.deletedAt.isNull())
        .and(p.visibility.eq("PUBLIC"));

List<PostListRow> rows = query
        .select(Projections.constructor(PostListRow.class,
                p.id, p.title, p.author.nickname,
                p.likeCount, p.commentCount, p.publishedAt))
        .from(p)
        .where(where)
        .orderBy(p.publishedAt.desc(), p.id.desc())
        .limit(20)
        .fetch();
```

실제 L14 실습은 OpenFeign QueryDSL 7.7과 annotation processor로 `QPost`를 생성합니다. 이 의존성과 생성 설정은 현재 루트 `build.gradle`이 아니라 L14 복원 코드에 있습니다. 필터가 선택값일 때만 `where.and(...)`를 추가하면 동적 검색에 유리합니다. 단순 고정 조회에는 파생 메서드가 더 짧을 수 있습니다. 여기서도 태그는 페이지 ID로 모아 별도 조회합니다.

</details>

## 차이는 쿼리 문법, 같아야 하는 건 계약

| 방식 | 조건을 적는 곳 | 누구의 이름을 쓰나 | 이 목록에서 주의할 점 |
|---|---|---|---|
| 파생 메서드 | 메서드 이름 | 엔티티 속성·연관 경로 | 간단한 필터에 적합. 복합 응답 DTO·커서는 별도 설계 |
| JPQL `@Query` | Repository 문자열 | 엔티티·Java 속성 | DTO 투영과 JOIN 가능. SQL 테이블명은 쓰지 않음 |
| native `@Query` | Repository 문자열 | 테이블·열 | MySQL 문법에 직접 접근. 결과 alias·매핑·이식성을 확인 |
| MyBatis | Mapper XML | 테이블·열 | SQL을 직접 관리. 파라미터 바인딩과 조건 일관성에 주의 |
| QueryDSL | Repository Java 코드 | 생성된 Q 타입·Java 속성 | 동적 조건 조립이 명확. 설정과 Q 타입 생성이 필요 |

## Controller · Service · DTO는 공통으로 둡니다

```java
// Controller: HTTP 값을 받는다. 이 경로는 M1 계약 예시이며 현재 루트 앱에 구현되어 있지 않다.
@GetMapping("/api/boards/{slug}/posts")
List<PostListItem> list(@PathVariable String slug,
                        @RequestParam(defaultValue = "20") int size,
                        @RequestParam(required = false) String cursor) {
    return service.listPublicFirstPage(slug, size, cursor);
}
```

```java
// Service: 정책·페이지 경계를 정하고 선택한 Repository/Mapper를 호출한다.
// 첫 페이지 학습에선 cursor가 빈 경우를 고정한다. 다음 페이지 조건은 DB-02에서 별도로 다룬다.
List<PostListItem> listPublicFirstPage(String slug, int size, String cursor) {
    // 여기서 size 범위와 cursor 처리를 정의한 뒤 query implementation을 호출한다.
    // 조회된 글 DTO에 page ID 기준의 tags를 붙인다.
}
```

```java
// DTO: content는 목록 응답에 없다. tags는 페이지 글 ID를 모아 조회한 뒤 채운다.
public record PostListItem(Long id, String title, String authorNickname,
                           Integer likeCount, Integer commentCount, List<String> tags,
                           LocalDateTime publishedAt) {}
```

완성 기능이라면 파생 메서드/JPA/QueryDSL 중 한 구현을 Service가 사용하고, MyBatis 구현은 비교 프로필 또는 별도 adapter로 선택합니다. 한 요청에서 여러 구현을 모두 호출해 결과를 합치는 구조가 아닙니다. 비교 실습에서는 같은 `slug=dev`, 빈 cursor, 크기 20을 각 경로에 넣고 JSON 필드·순서·행 수를 대조합니다.

## 실제 실행 SQL은 어디서 보나요?

1. L12/L13/L14 중 사용할 실습 overlay를 복원하고 해당 프로필로 앱을 켭니다. 기본 루트 앱에는 MyBatis와 QueryDSL 의존성이 없습니다.
2. 요청 버튼 또는 Postman 예시로 동일한 첫 페이지 요청을 보냅니다. M1 API 구현이 없는 체크아웃에서는 각 쿼리 함수를 테스트에서 같은 파라미터로 호출하세요.
3. JPA 파생 메서드·JPQL·QueryDSL은 Hibernate SQL 로그에서 SQL 형태를 봅니다. 로그의 `?`만으로는 바인딩 값이 보이지 않을 수 있어 바인드 파라미터 로그를 별도로 켭니다. MyBatis는 Mapper namespace/statement와 함께 SQL을 확인합니다.
4. 결과를 MySQL에서 확인하려면 CloudBeaver의 `practice (학습용)` 연결에서 SQL을 실행합니다. 요청이 DB에 실제 보낸 SQL과 직접 입력한 SQL이 같은지 WHERE·ORDER BY·LIMIT·JOIN을 대조합니다.
5. 성능을 주장하기 전에는 같은 데이터와 파라미터로 `EXPLAIN`을 실행합니다. `EXPLAIN`은 실행계획을 설명하며 SELECT 결과 행을 반환하는 명령이 아닙니다. 실행계획과 실제 반환 결과를 따로 기록합니다.

실제 JDBC 실행문과 바인딩 값을 로그로 남기는 설정은 개발 DB에서만 짧게 사용하세요. 민감한 요청값이 로그에 남을 수 있고, SQL 로그의 출력만으로 실제 소요 시간이나 인덱스 효율을 결론 내릴 수 없습니다.

## 완료 확인

- 다섯 경로에 같은 `dev`, `PUBLISHED`, 미삭제, `PUBLIC`, `publishedAt DESC, id DESC`, 첫 20개 조건이 들어 있다.
- 각 경로의 응답은 본문을 빼고 같은 7개 필드를 제공하며 첫 5개 ID가 `145, 144, 143, 140, 138`이다.
- `tags[]`를 메인 JOIN에서 중복 행으로 만들지 않고 현재 페이지 ID를 모아 일괄 조회한다.
- SQL 로그에서 ORM이 만든 SQL과 MyBatis XML의 SQL을 각각 찾고, 실제 WHERE·ORDER BY·LIMIT을 M1 계약과 대조했다.
- 현재 루트 앱의 실제 API와 L12–L14 복원 실습의 비교 경로를 구분해 설명할 수 있다.

## 다음으로

- 앞 단계: [DB-01 — 응답 필드에서 첫 SQL 찾기](db-01-response-to-query.md) · [DB-02 — 커서 SQL 만들기](db-02-select-cursor.md)
- 기초 연습: [L12 파생 메서드](../labs/l12-query-methods/README.md) · [L13 `@Query`와 MyBatis](../labs/l13-declared-queries/README.md) · [L14 QueryDSL](../labs/l14-querydsl-extension/README.md)
- 공식 자료: [Spring Data JPA 쿼리 메서드](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html) · [MyBatis Mapper XML](https://mybatis.org/mybatis-3/sqlmap-xml.html) · [OpenFeign QueryDSL](https://github.com/OpenFeign/querydsl)
