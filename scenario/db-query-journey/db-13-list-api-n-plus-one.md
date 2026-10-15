# DB-13. GET 목록 API의 흐름과 N+1을 직접 계측하기 — 기초→중급

<style>
main:has(.db13){max-width:1500px}.db13{--ink:#172d50;--muted:#60738a;--line:#d8e3f0;color:var(--fg)}.db13 *{box-sizing:border-box}.db13 .lead{line-height:1.55}.db13 .contract{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:11px 14px;border:1px solid #93c5fd;border-radius:14px;background:linear-gradient(100deg,#eff6ff,#f0fdfa);color:#13294b}.db13 .method{padding:5px 9px;border-radius:8px;background:#d1fae5;color:#087857;font-weight:900}.db13 .path{font:800 .85rem ui-monospace,monospace;overflow-wrap:anywhere}.db13 .flow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:14px 0}.db13 .step{position:relative;min-width:0;padding:12px;border:1px solid var(--line);border-radius:15px;background:linear-gradient(150deg,#fff,#f4f8ff)}.db13 .step:nth-child(2){background:linear-gradient(150deg,#fff,#effbf8)}.db13 .step:nth-child(3){background:linear-gradient(150deg,#fff,#fff8eb)}.db13 .step:nth-child(4){background:linear-gradient(150deg,#fff,#f4f0ff)}.db13 .step:nth-child(5){background:linear-gradient(150deg,#fff,#f0fdfa)}.db13 .step:not(:last-child):after{content:'→';position:absolute;right:-15px;top:45%;z-index:2;color:#0d9bad;font-size:1.1rem;font-weight:900}.db13 h2{margin:0 0 7px;font-size:.88rem;color:var(--ink)}.db13 .step p{font-size:.73rem;line-height:1.5;color:var(--muted)}.db13 .chip{display:inline-block;margin:2px;padding:4px 6px;border:1px solid #d7e2ee;border-radius:7px;background:#fff;color:#344c6c;font:700 .63rem ui-monospace,monospace}.db13 .counts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:12px 0}.db13 .count{padding:12px;border:1px solid var(--line);border-radius:13px;background:var(--card)}.db13 .count strong{display:block;font-size:1.1rem;color:#8dd8ff}.db13 .count small{color:#c7d2df}.db13 .count .trace{display:flex;align-items:center;gap:4px;height:25px;margin-top:10px}.db13 .count .trace i{display:block;height:11px;border-radius:5px;background:#f4a451;box-shadow:0 0 9px #f4a45155;flex:1}.db13 .count .trace i:first-child{background:#8dbaf6}.db13 .count .trace.batch i{height:15px;flex:0 0 68%;background:linear-gradient(90deg,#29b8e2,#48dfc2);box-shadow:0 0 10px #36cfc655}.db13 .count .trace.batch i:last-child{height:10px;flex:0 0 23%;background:#8dbaf6;box-shadow:none}.db13 pre{overflow:auto;padding:12px;border-radius:11px;background:#11243c;color:#e0edff;font:.72rem/1.55 ui-monospace,monospace;white-space:pre-wrap}.db13 .note{padding:11px 13px;border-left:4px solid #e4a23a;border-radius:9px;background:#fff4d8;color:#603d11;line-height:1.55}.db13 details{margin:15px 0}.db13 summary{cursor:pointer;color:#2563eb;font-weight:850}.db13 .panel{margin-top:10px;padding:13px;border:1px solid var(--line);border-radius:13px;background:var(--card);line-height:1.55}@media(max-width:1000px){.db13 .flow{grid-template-columns:repeat(3,minmax(0,1fr))}.db13 .step:nth-child(3):after{content:'↓';right:48%;top:auto;bottom:-15px}}@media(max-width:650px){.db13 .flow{grid-template-columns:1fr;gap:9px}.db13 .step:not(:last-child):after,.db13 .step:nth-child(3):after{content:'↓';right:48%;top:auto;bottom:-15px}.db13 .counts{grid-template-columns:1fr}.db13 pre{font-size:.65rem}}
</style>

<section class="db13" aria-label="목록 요청이 Controller에서 SQL과 응답까지 이어지는 흐름">
<p class="lead"><a href="db-01-response-to-query.html">DB-01</a>의 게시판 글 목록을 다시 봅니다. 요청이 Controller에서 Repository를 거쳐 SQL로 내려가고, 결과 DTO가 응답으로 돌아옵니다. 이번 핵심은 <strong>응답 내용은 같아도 SQL 호출 수가 글 수에 따라 늘어날 수 있다</strong>는 점입니다.</p>
<div class="contract"><span class="method">GET</span><span class="path">/api/boards/{slug}/posts?size=20&amp;cursor=</span><span>M1 · 제목·작성자·반응 수·태그·발행 시각</span></div>
<div class="flow" aria-label="브라우저 요청에서 응답까지 다섯 단계">
  <section class="step"><h2>① 요청</h2><p>브라우저가 게시판 slug, 페이지 크기, 커서를 보냅니다.</p><span class="chip">GET</span><span class="chip">slug=dev</span></section>
  <section class="step"><h2>② Controller</h2><p>HTTP 입력을 검증하고 Service에 검색 조건을 전달합니다.</p><span class="chip">경로·쿼리 파라미터</span><span class="chip">응답 변환</span></section>
  <section class="step"><h2>③ Service</h2><p>게시글 목록을 읽고 필요한 DTO를 조립하도록 Repository를 호출합니다.</p><span class="chip">업무 규칙</span><span class="chip">R1 필터 의미</span></section>
  <section class="step"><h2>④ Repository → SQL</h2><p>게시글·작성자·태그·카운트를 데이터베이스에서 가져옵니다.</p><span class="chip">여기가 N+1 후보</span></section>
  <section class="step"><h2>⑤ DTO 응답</h2><p>엔티티가 아니라 API가 약속한 열만 JSON으로 돌려줍니다.</p><span class="chip">본문 제외</span><span class="chip">tags[]</span></section>
</div>
<div class="counts" aria-label="쿼리 횟수 패턴 비교">
  <div class="count"><strong>1 + N (+ N)</strong><small>설명용 N+1 패턴: 목록 1회 뒤 작성자·태그를 각 글마다 조회</small><div class="trace" aria-label="첫 목록 조회 뒤 작은 SQL 호출이 반복되는 설명 그림"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
  <div class="count"><strong>1 또는 2회 등</strong><small>DTO 조회나 목록 + 태그 일괄 조회. 실제 수는 구현과 계측으로 확정</small><div class="trace batch" aria-label="목록과 태그를 각각 일괄 조회하는 설명 그림"><i></i><i></i></div></div>
</div>
<p class="note"><strong>그림의 N은 측정 결과가 아닙니다.</strong> N개 행을 순회할 때 쿼리를 한 번씩 호출하는 코드의 일반적인 횟수 패턴입니다. 현재 저장소에서 특정 API를 실행해 얻은 로그 수치와 구분하세요.</p>
</section>

## N+1이 생기는 코드 모양

목록을 한 번 읽은 뒤 반복문 안에서 작성자를 조회한다면 요청 한 건에 SQL 한 번, 작성자 N명에 SQL N번이 더해집니다. 태그도 글마다 별도 조회하면 또 N번이 추가됩니다. 이것은 **설명용 의사 코드**이며 저장소의 완성 구현 또는 실제 실행 로그가 아닙니다.

```java
// 설명용 의사 코드: 반복 안의 Repository 호출이 추가 SELECT를 만들 수 있다.
List<Post> posts = postRepository.findPage(boardSlug, size, cursor); // 1회

for (Post post : posts) {
    Member author = memberRepository.findById(post.getAuthorId());   // N회
    List<Tag> tags = tagRepository.findByPostId(post.getId());       // N회
    result.add(PostListResponse.from(post, author, tags));
}
```

글이 20개면 “1+20+20”이라는 **호출 형태**가 됩니다. 실제 DB statement 수는 캐시, 배치 로딩, ORM 설정, 중복 작성자 수, 코드 경로에 따라 달라집니다. 이 산술은 실험 결과가 아니므로 예상값 칸에 실제 로그처럼 적지 않습니다.

## 한 번의 조회로 작성자 DTO 만들기

작성자 이름이 응답에 필요하다면 Repository의 projection query에서 게시글과 작성자를 JOIN해 필요한 열만 바로 읽을 수 있습니다. 아래는 SQL 구조 예시입니다. R1 접근 조건, 커서 조건, 전체 응답 카운트, 태그 배열은 API 구현 계약에 맞춰 추가해야 합니다.

```sql
SELECT p.id,
       p.title,
       m.nickname AS author_nickname,
       p.like_count,
       p.comment_count,
       p.published_at
FROM board AS b
JOIN post AS p ON p.board_id = b.id
JOIN member AS m ON m.id = p.author_id
WHERE b.slug = :board_slug
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
ORDER BY p.published_at DESC, p.id DESC
LIMIT :size_plus_one;
```

태그를 각 글마다 찾는 대신 페이지의 ID들을 모아 두 번째 쿼리로 가져올 수 있습니다.

```sql
SELECT pt.post_id, t.name
FROM post_tag AS pt
JOIN tag AS t ON t.id = pt.tag_id
WHERE pt.post_id IN (:page_post_ids)
ORDER BY pt.post_id, t.name;
```

이 접근은 “게시글 페이지 조회 + 페이지 태그 조회” 두 SQL로 나눈 형태입니다. 이 페이지에선 측정한 결과라고 말하지 않습니다. 작성자 JOIN과 태그 batch 조회를 실제 Repository로 옮긴 뒤 SQL 로그에서 문장 수와 결과를 확인하세요. 한 번의 쿼리로 모든 컬렉션을 JOIN하면 게시글 한 행이 태그·댓글 수만큼 복제되고 페이지 제한이 달라질 수 있으므로, 다대다·일대다 컬렉션 fetch join과 페이징을 함께 쓸 때는 결과 행 수를 따로 검증해야 합니다.

## API 요청 하나를 추적하는 실습

1. [M1](../../practice/MISSIONS.md)의 목록 응답 필드에서 테이블을 찾습니다: `post`, `member`, `post_like`/`post`의 카운트, `post_tag`와 `tag`.
2. 코드에서 `@GetMapping("/api/boards/{slug}/posts")`를 찾아 Controller가 받는 값을 기록합니다.
3. Controller가 호출하는 Service와 그 Service가 호출하는 Repository 메서드를 따라갑니다.
4. SQL 로그를 켜고 한 번 요청합니다. 시간대별 같은 SELECT의 개수를 센 뒤 결과 DTO의 `tags[]`와 작성자 이름이 맞는지 확인합니다.
5. 페이지 크기만 바꾸어 다시 요청합니다. 쿼리 수가 페이지 크기와 함께 늘어나는지 확인합니다.
6. JOIN projection 또는 두 번의 고정 조회로 바꾼 뒤 같은 요청을 반복하고, JSON 결과와 SQL 수를 모두 비교합니다.

저장소의 기존 계측 예시는 [5-3 댓글 목록의 `PostListQueryCountTest`](../ch5-comment/5-3-comment-list-delete.md)에서 확인할 수 있습니다. 그 테스트는 MyBatis `Executor`에서 실제 SELECT 문장을 세고 서로 다른 페이지 크기에서 수가 일정한지 검사합니다. **그 테스트 경로의 로그가 이 M1 API의 측정 결과를 대신하지는 않습니다.** 현재 M1 구현의 실제 수치는 해당 경로를 계측해 얻어야 합니다. JPA만 사용한다면 Hibernate SQL 로그나 Hibernate Statistics를 쓰고, MyBatis가 포함되면 MyBatis Executor 또는 datasource 레벨 계측을 사용합니다.

<details>
<summary>왜 모든 관계를 EAGER로 바꾸면 안 되나요?</summary>
<section class="panel">
필요한 관계만 조회별로 가져오도록 지정합니다. 모든 관계를 EAGER로 바꾸면 해당 API가 쓰지 않는 관계까지 읽고, 여러 컬렉션을 동시에 JOIN할 경우 결과 행이 곱처럼 늘어날 수 있습니다. LAZY만 둔다고 N+1이 자동으로 해결되는 것도 아닙니다. 실제 SQL을 센 다음 DTO projection, EntityGraph, batch size 등 호출 목적에 맞는 방식을 선택하고 다시 측정하세요.
</section>
</details>

## 완료 기준

- Controller → Service → Repository → SQL → DTO 응답을 실제 코드 경로로 설명한다.
- 반복문 안의 Repository 호출이 어떤 추가 SELECT를 만들 수 있는지 말한다.
- 서로 다른 페이지 크기에서 실제 SQL 로그를 세고, 측정에 사용한 도구와 결과를 기록한다.
- 개선 후에도 같은 게시글 ID·정렬·작성자·태그가 반환되는지 비교한다.
- 이 문서의 `1 + N (+ N)` 설명값과 자신이 계측한 실제 값을 구분한다.

## 연결

- API 계약: [M1 — 게시판 글 목록·상세](../../practice/MISSIONS.md)
- 앞 단계: [DB-01 응답에서 첫 SQL까지](db-01-response-to-query.md) · [DB-12 JOIN·EXISTS와 EXPLAIN](db-12-join-exists-explain.md)
- 관련 지식: [S09 — JPA LAZY와 N+1](../../docs/knowledge/S09-jpa-hibernate.md#lazy와-n1)
