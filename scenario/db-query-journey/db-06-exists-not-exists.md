# DB-06. 좋아요는 했지만 북마크하지 않은 글 — IN·EXISTS·NOT EXISTS · 중급

<style>
main:has(.db06){max-width:1440px}.db06{--ink:#172d50;--muted:#60738a;--line:#d8e3f0;--blue:#2563eb;--teal:#0f8b8d;--amber:#b76512;color:var(--fg)}.db06 *{box-sizing:border-box}.db06 .lead{font-size:1rem;line-height:1.6;color:var(--fg)}.db06 .contract{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:12px 15px;border:1px solid #93c5fd;border-radius:14px;background:linear-gradient(100deg,#eff6ff,#f0fdfa);color:#13294b}.db06 .method{padding:5px 9px;border-radius:8px;background:#d1fae5;color:#087857;font-weight:900}.db06 .path{font:800 .88rem ui-monospace,monospace;overflow-wrap:anywhere}.db06 .flow{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:15px 0}.db06 .panel{min-width:0;padding:14px;border:1px solid var(--line);border-radius:15px;background:linear-gradient(150deg,#fff,#f5f9ff);color:var(--ink)}.db06 h2{margin:0 0 8px;color:var(--fg);font-size:1rem}.db06 .panel h2{color:var(--ink)}.db06 .panel code{padding:1px 4px;border-radius:4px;background:#eaf2ff;color:#284568}.db06 p{line-height:1.55}.db06 .small{font-size:.8rem;color:var(--fg)}.db06 .panel .small,.db06 .contract .small{color:var(--muted)}.db06 .rows{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.db06 .row{padding:8px 6px;border:1px solid #d5e2f0;border-radius:9px;background:#fff;text-align:center;font:700 .73rem ui-monospace,monospace;color:#334b68}.db06 .row.like{border-color:#5bc9ae;background:#e8fbf4}.db06 .row.bookmark{border-color:#f1c36d;background:#fff5dc}.db06 .row.keep{outline:2px solid #7354c8;color:#5736a5}.db06 .legend{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0;font-size:.72rem;color:var(--muted)}.db06 .legend b{color:var(--ink)}.db06 .sql{overflow:auto;padding:13px;border-radius:11px;background:#11243c;color:#e0edff;font:.76rem/1.6 ui-monospace,SFMono-Regular,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.db06 .sql .focus{color:#7ee7cb;font-weight:800}.db06 .task{padding:13px 15px;border-left:4px solid var(--amber);border-radius:10px;background:#fff5df;color:#573a12;line-height:1.6}.db06 details{margin:15px 0}.db06 summary{cursor:pointer;color:var(--blue);font-weight:800}.db06 .nullcase{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin:10px 0;padding:12px;border:1px solid var(--line);border-radius:12px;background:#f8fbff;color:var(--ink)}.db06 .nullcase strong{color:#a23b3b}.db06 .arrow{color:var(--teal);font-size:1.2rem;font-weight:900}@media(max-width:760px){.db06 .flow{grid-template-columns:1fr}}@media(max-width:520px){.db06 .rows{grid-template-columns:repeat(2,minmax(0,1fr))}.db06 .nullcase{grid-template-columns:1fr;text-align:center}.db06 .arrow{transform:rotate(90deg)}}
</style>

<section class="db06" aria-label="좋아요와 북마크를 비교하는 서브쿼리 연습">
<p class="lead"><a href="db-02-select-cursor.html">DB-02</a>에서 목록을 조회했다면, 이번에는 <strong>두 관계 테이블을 비교해 제외 조건</strong>을 만듭니다. 목표는 회원 12가 좋아요한 글 중 북마크하지 않은 글입니다.</p>
<div class="contract"><span class="method">SQL 실습</span><span class="path">GET /api/me/likes에서 확장 · M9-6 좋아요 − 북마크</span><span class="small">기존 practice seed · 읽기 전용 SQL</span></div>

<div class="flow" aria-label="좋아요에서 북마크 제외 결과까지">
<section class="panel"><h2>① 두 테이블의 관계 행</h2><p class="small">아래 101·102·103은 원리를 설명하는 임의의 작은 예시 ID입니다. 실제 시드의 기대 결과가 아닙니다.</p><div class="rows" aria-label="설명용 좋아요 행"><div class="row like">좋아요<br>101</div><div class="row like">좋아요<br>102</div><div class="row like">좋아요<br>103</div></div><div class="legend"><span><b>초록</b> post_like에 행 있음</span></div><div class="rows" aria-label="설명용 북마크 행"><div class="row bookmark">북마크<br>102</div><div class="row bookmark">북마크<br>103</div></div><div class="legend"><span><b>노랑</b> bookmark에 행 있음</span></div><div class="row keep">필터 결과<br>101만 남음</div></section>
<section class="panel"><h2>② 바깥 행 하나씩 질문하기</h2><p><code>post_like</code>에서 회원 12의 글을 한 행씩 꺼냅니다.</p><div class="nullcase"><span>좋아요 행의 post_id</span><b class="arrow">→</b><span>같은 member_id와 post_id의 bookmark가 있나?</span></div><p><strong>있으면 제외, 없으면 결과에 남김.</strong> 그래서 예시 결과는 101입니다. 이 질문을 SQL로 표현하는 방법이 <code>NOT EXISTS</code>입니다.</p></section>
</div>

<h2>먼저 완성할 SQL</h2>
<pre class="sql"><code>SELECT pl.post_id
FROM post_like AS pl
WHERE pl.member_id = 12
  AND <span class="focus">NOT EXISTS (
      SELECT 1
      FROM bookmark AS b
      WHERE b.member_id = pl.member_id
        AND b.post_id = pl.post_id
  )</span>
ORDER BY pl.created_at DESC, pl.id DESC;</code></pre>
<p class="small">여기서 <code>pl.member_id</code>, <code>pl.post_id</code>는 바깥 쿼리의 현재 행을 안쪽 쿼리에 전달합니다. 안쪽 쿼리는 그 글의 북마크 행이 있는지만 검사합니다. 실제 API 구현에서는 SELECT와 ORDER BY가 응답 계약에 맞는지 먼저 정하고, 이 SQL 조각은 필터 조건에 넣습니다.</p>

<div class="task"><strong>직접 해보기</strong><br>회원 번호를 12로 고정해 쿼리를 실행하고 결과 ID를 기록하세요. 그다음 아래 <code>EXISTS</code>와 <code>NOT IN</code> 버전으로 바꾸어 ID와 순서를 비교합니다. 예상 결과 숫자는 이 문서에서 만들지 않습니다. 본인이 사용하는 practice seed에서 확인하세요.</div>

<details>
<summary>EXISTS는 반대로 “북마크도 한 글”을 찾는다</summary>
<pre class="sql"><code>SELECT pl.post_id
FROM post_like AS pl
WHERE pl.member_id = 12
  AND EXISTS (
      SELECT 1
      FROM bookmark AS b
      WHERE b.member_id = pl.member_id
        AND b.post_id = pl.post_id
  )
ORDER BY pl.created_at DESC, pl.id DESC;</code></pre>
<p><code>EXISTS</code>는 안쪽 쿼리가 한 행이라도 찾으면 TRUE입니다. 위 결과는 “좋아요와 북마크 둘 다 한 글”이고, 앞의 <code>NOT EXISTS</code> 결과와 서로 반대 관계입니다. <code>SELECT 1</code>은 존재 여부만 확인하고 실제 열 값은 사용하지 않는다는 표시입니다.</p>
</details>

<details>
<summary>같은 제외 조건을 NOT IN으로 표현하면?</summary>
<pre class="sql"><code>SELECT pl.post_id
FROM post_like AS pl
WHERE pl.member_id = 12
  AND pl.post_id NOT IN (
      SELECT b.post_id
      FROM bookmark AS b
      WHERE b.member_id = 12
  )
ORDER BY pl.created_at DESC, pl.id DESC;</code></pre>
<p><code>IN</code>은 안쪽 조회가 만든 값 목록에 바깥 값이 포함되는지 확인합니다. 이 예제의 <code>bookmark.post_id</code>는 <code>NOT NULL</code>이고, 안쪽 조건의 <code>member_id</code>도 실제 스키마에서 <code>NOT NULL</code>입니다. 따라서 현재 테이블 제약에서는 위 <code>NOT IN</code> 결과가 <code>NOT EXISTS</code>와 일치해야 합니다.</p>
</details>

<details>
<summary>NULL이 섞이면 NOT IN은 왜 위험한가?</summary>
<p>이 장난감 표는 <strong>NULL 동작만 보여 주는 가상 예시</strong>이며 practice seed의 실제 행은 아닙니다.</p>
<div class="rows" aria-label="NULL 설명용 가상 값"><div class="row">좋아요<br>101</div><div class="row">좋아요<br>102</div><div class="row">북마크 목록<br>102</div><div class="row"><strong>북마크 목록<br>NULL</strong></div></div>
<div class="nullcase"><span><code>101 NOT IN (102, NULL)</code></span><b class="arrow">→</b><span><strong>TRUE/FALSE로 확정되지 않음</strong><br>WHERE는 TRUE만 통과시켜 101도 결과에서 사라짐</span></div>
<p><code>NOT EXISTS</code>는 각 좋아요 행과 같은 키의 북마크 행이 실제로 있는지 검사하므로, 비교 대상 목록에 무관한 NULL이 포함되어 결과 전체가 미정이 되는 문제를 피합니다. 다만 올바른 키와 NULL 허용 여부를 먼저 확인해야 합니다. 이 프로젝트의 `bookmark.post_id`에는 NOT NULL 제약이 있어 실제 미션에서는 해당 NULL 함정이 재현되지 않습니다.</p>
</details>

<details>
<summary>EXISTS와 JOIN은 언제 같은 결과가 되나요?</summary>
<pre class="sql"><code>SELECT pl.post_id
FROM post_like AS pl
LEFT JOIN bookmark AS b
  ON b.member_id = pl.member_id
 AND b.post_id = pl.post_id
WHERE pl.member_id = 12
  AND b.id IS NULL
ORDER BY pl.created_at DESC, pl.id DESC;</code></pre>
<p>LEFT JOIN으로 짝이 없는 행을 찾는 방식도 가능합니다. 다만 북마크 조건을 `WHERE`가 아니라 `ON`에 두어야 합니다. 이 관계는 `(member_id, post_id)` UNIQUE KEY로 중복을 막으므로 이 예제의 JOIN은 좋아요 한 행을 북마크 여러 행으로 늘리지 않습니다. `EXISTS`는 “관련 행이 있는가?”라는 의도를 직접 표현해 읽기 쉽습니다. 결과 순서는 API의 정렬 계약에 맞춰 비교하세요.</p>
</details>

<details>
<summary>JPA·MyBatis로 옮길 때 찾아볼 위치</summary>
<ul>
<li><strong>MyBatis:</strong> Mapper XML의 `SELECT` 조건에 `NOT EXISTS`를 작성하고 `memberId`를 파라미터로 바인딩합니다.</li>
<li><strong>JPA:</strong> JPQL의 `NOT EXISTS` 상관 서브쿼리 또는 native query를 선택합니다. 생성 SQL과 결과 순서를 확인합니다.</li>
<li><strong>Service:</strong> 로그인 회원 ID와 페이지·정렬 계약을 Repository/Mapper에 전달합니다. SQL 조건을 Service에서 문자열로 조립하지 않습니다.</li>
</ul>
<p class="small">이번 페이지는 SQL 읽기·작성 연습입니다. 독립적인 API를 새로 만들거나 실제 서버 요청을 보내지 않습니다. 같은 SQL을 JPA·MyBatis·QueryDSL로 옮기는 단계는 DB-07에서 이어집니다.</p>
</details>
</section>

## 스키마 근거와 실행

이 실습은 [M9-6](../../practice/MISSIONS.md)의 “좋아요는 눌렀는데 북마크는 안 한 글”을 SQL로 푼다. 실제 스키마는 [`docker/mysql/init/02-practice.sql`](../../docker/mysql/init/02-practice.sql)에서 확인한다.

| 테이블 | 이번 쿼리에서 쓰는 열 | 실제 제약 |
|---|---|---|
| `post_like` | `id`, `post_id`, `member_id`, `created_at` | 회원·게시글 FK, `(post_id, member_id)` UNIQUE |
| `bookmark` | `id`, `post_id`, `member_id` | 회원·게시글 FK, `post_id NOT NULL`, `(member_id, post_id)` UNIQUE |

CloudBeaver의 `practice (학습용)` 연결에서 실행한다. 기대 결과의 ID 개수와 순서를 별도로 기록하고, NOT EXISTS·NOT IN·LEFT JOIN 세 쿼리 결과를 비교한다. 기본 seed의 테이블이나 인덱스를 수정하지 않는다.

## 연결 경로

- 앞 단계: [DB-02 — 목록 SQL 조건과 커서](db-02-select-cursor.md)
- 기능 미션: [M9-6 — 좋아요는 눌렀는데 북마크는 안 한 글](../../practice/MISSIONS.md)
- 다음 단계: DB-07 — 동일 SQL을 JPA·MyBatis·QueryDSL로 옮기기
- 심화: DB-12 — 같은 조건의 JOIN·서브쿼리 실행 계획 비교
