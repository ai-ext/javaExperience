# DB-04. 태그가 붙은 글 찾기 — JOIN, EXISTS, DISTINCT · 기초→중급

<!-- Imagegen 시안 프롬프트: 텍스트 없는 교육용 데이터 워크벤치. 왼쪽은 post 2 한 행이 spring, jpa 두 개의 post_tag 연결 행으로 갈라지는 관계 그림, 가운데는 JOIN 결과에서 post 2가 두 번 나타나는 표, 오른쪽은 EXISTS 결과에서 글 한 행만 유지되는 표. 작은 노란 경고로 “JOIN은 연결 행 수만큼 결과가 늘어남”, 청록색으로 EXISTS가 한 번만 반환함을 시각화. 밝은 배경, navy/teal/orange palette, 실제 화면 글자는 넣지 않는다. -->

<style>
main:has(.db04){max-width:1420px}.db04{--ink:#173253;--muted:#5f7288;--line:#d8e3ef;color:var(--fg)}.db04 *{box-sizing:border-box}.db04 .lead{color:var(--fg);line-height:1.55}.db04 .hero{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:12px;margin:14px 0}.db04 .panel{min-width:0;padding:13px;border:1px solid var(--line);border-radius:15px;background:linear-gradient(150deg,#fff,#f4f8fd);color:var(--ink)}.db04 .panel h2{margin:0 0 8px;color:var(--ink);font-size:.92rem}.db04 .panel p{margin:6px 0;color:var(--muted);font-size:.76rem;line-height:1.5}.db04 .panel p code{background:#e6eef8;color:#23415f;border-radius:4px;padding:1px 3px}.db04 table{width:100%;border-collapse:collapse;font-size:.75rem}.db04 th,.db04 td{padding:6px;border-bottom:1px solid #e3eaf2;text-align:left}.db04 th{color:#5f7288}.db04 .rows{display:flex;flex-direction:column;gap:5px}.db04 .row{padding:7px 8px;border:1px solid #d7e2ee;border-radius:8px;background:#fff;color:#243b59;font:700 .72rem ui-monospace,monospace}.db04 .row.dup{border-color:#efb45a;background:#fff4df}.db04 .row.one{border-color:#68c8b0;background:#eaf9f4}.db04 .joins{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:7px;margin:8px 0;color:#175c68;font-size:.75rem;font-weight:800}.db04 .arrow{color:#0b9b91;font-size:1.1rem}.db04 .pill{display:inline-block;margin:2px;padding:3px 6px;border-radius:6px;background:#e8f0ff;color:#31527a;font-size:.68rem;font-weight:800}.db04 .sql{overflow:auto;padding:12px;border-radius:11px;background:#11243c;color:#e0edff;font:.75rem/1.55 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.db04 .note{padding:11px 13px;border-left:4px solid #e4a23a;border-radius:9px;background:#fff4d8;color:#624312;line-height:1.5}.db04 details{margin:14px 0}.db04 summary{cursor:pointer;color:#2563eb;font-weight:850}.db04 details[open]>summary{margin-bottom:10px}@media(max-width:850px){.db04 .hero{grid-template-columns:1fr 1fr}.db04 .hero .panel:last-child{grid-column:1/-1}}@media(max-width:560px){.db04 .hero{grid-template-columns:1fr}.db04 .hero .panel:last-child{grid-column:auto}}
</style>

<section class="db04" aria-label="태그 검색에서 JOIN 중복과 EXISTS를 비교">
<p class="lead"><a href="db-03-detail-join.html">DB-03 상세 JOIN</a>에서 필수·선택 관계를 봤습니다. 이번에는 “spring 또는 jpa 태그가 붙은 글”을 찾습니다. 같은 글에 조건에 맞는 태그가 여러 개면 JOIN 결과도 여러 행이 됩니다.</p>

<div class="hero" aria-label="실제 시드 글 하나가 태그 JOIN에서 중복되는 과정">
  <section class="panel"><h2>① 실제 seed의 관계 행</h2><p><code>01-community.sql</code>의 post 2에는 태그 두 개가 연결되어 있습니다.</p><div class="row">post · id 2 · JPA 연관관계 매핑 정리</div><div class="joins"><span>post 2</span><span class="arrow">→</span><span>post_tag</span></div><div class="row">(post_id 2, tag_id 2) → spring</div><div class="row">(post_id 2, tag_id 3) → jpa</div></section>
  <section class="panel"><h2>② 태그 이름으로 JOIN하면</h2><p>두 연결 행이 모두 검색 조건을 통과해 동일한 글이 두 번 나타납니다.</p><div class="row dup">id 2 · JPA 연관관계 매핑 정리 · spring</div><div class="row dup">id 2 · JPA 연관관계 매핑 정리 · jpa</div><div class="pill">결과 행 2개</div><div class="pill">서로 다른 글 1개</div></section>
  <section class="panel"><h2>③ EXISTS로 글을 고르면</h2><p>“이 글에 조건을 만족하는 태그가 하나라도 있나?”만 검사합니다.</p><div class="row one">id 2 · JPA 연관관계 매핑 정리</div><div class="pill">결과 행 1개</div><div class="pill">중복 없음</div></section>
</div>

<div class="note"><strong>첫 판단:</strong> 태그 이름도 결과로 내보내고 싶어 태그별 행이 필요하면 JOIN이 맞습니다. 글 목록만 필요하고 조건에 맞는 태그가 있는지만 알면 EXISTS가 자연스럽습니다.</div>

<details>
<summary>태그 조건에 맞는 글 목록 만들기 — JOIN과 DISTINCT</summary>
<p>아래 JOIN은 실제 seed의 post 2에서 두 행을 반환합니다. `DISTINCT`는 결과의 글 열이 같은 행을 한 번으로 줄입니다.</p>
<pre class="sql"><code>SELECT DISTINCT
    p.id,
    p.title,
    p.published_at
FROM post AS p
JOIN post_tag AS pt
    ON pt.post_id = p.id
JOIN tag AS t
    ON t.id = pt.tag_id
WHERE t.name IN ('spring', 'jpa')
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
ORDER BY p.published_at DESC, p.id DESC;</code></pre>
<p><code>DISTINCT</code>는 결과 열 전체를 비교합니다. SELECT에 태그 이름까지 추가하면 spring 행과 jpa 행은 서로 다른 결과이므로 둘 다 남습니다. “글만 한 번씩”이 계약이라면 태그 이름을 함께 투영하지 않거나 EXISTS를 고릅니다.</p>
</details>

<details>
<summary>목록의 각 글을 한 번만 검사하기 — EXISTS</summary>
<pre class="sql"><code>SELECT
    p.id,
    p.title,
    p.published_at
FROM post AS p
WHERE p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM post_tag AS pt
      JOIN tag AS t
        ON t.id = pt.tag_id
      WHERE pt.post_id = p.id
        AND t.name IN ('spring', 'jpa')
  )
ORDER BY p.published_at DESC, p.id DESC;</code></pre>
<p>바깥 쿼리의 기준은 `post`이므로 글 한 행은 한 번만 반환됩니다. 안쪽 쿼리는 조건 태그의 존재 여부만 확인합니다. 글마다 태그를 붙여 응답해야 한다면 별도의 태그 로딩·집계를 설계하세요.</p>
</details>

<details>
<summary>언제 JOIN, EXISTS, DISTINCT를 고를까?</summary>
<table><thead><tr><th>필요한 결과</th><th>시작 선택</th><th>점검할 점</th></tr></thead><tbody>
<tr><td>글과 각 태그를 한 행씩</td><td>JOIN</td><td>글이 태그 수만큼 반복되는 것이 맞는 응답인지</td></tr>
<tr><td>조건에 맞는 태그가 있는 글</td><td>EXISTS</td><td>존재 검사 결과가 글 행을 늘리지 않음</td></tr>
<tr><td>JOIN 결과에서 글 열을 중복 제거</td><td>DISTINCT</td><td>투영 열을 추가하면 중복 판정도 달라짐</td></tr>
</tbody></table>
<p>이 선택은 “빠른 SQL 문법”을 고르는 문제가 아닙니다. 먼저 응답에서 한 행이 무엇을 뜻하는지 정하고, 그 행 단위에 맞는 관계 표현을 택합니다. 실제 속도 차이는 데이터 분포와 실행 계획을 DB-12에서 확인합니다.</p>
</details>
</section>

## API 계약으로 연결하기

태그를 이용한 글 목록 API를 만든다면, 먼저 결과 한 행이 “게시글 1개”인지 “게시글-태그 쌍 1개”인지 정합니다. `GET /api/boards/{slug}/posts` 응답처럼 글 한 건을 한 번만 반환하면서 태그 배열을 포함하려면, 글 필터와 태그 응답 로딩을 구분하고 페이지 경계가 깨지지 않는지 확인해야 합니다. M1은 태그가 포함된 목록 응답과 태그 조회 N+1 점검을 요구합니다.

학습 순서:

1. `post_tag`에서 실제로 글 하나에 연결된 태그 행 수를 확인합니다.
2. JOIN 결과에서 `p.id`가 중복되는 이유를 설명합니다.
3. 같은 조건을 EXISTS로 바꾸고 글 ID가 한 번씩 나오는지 확인합니다.
4. 응답 DTO가 태그 배열을 요구할 때 목록 페이지 조회와 태그 적재 전략을 따로 설계합니다.

## 다음 단계

- 이전: [DB-03 — 상세 API JOIN](db-03-detail-join.md)
- 다음: [DB-05 — 좋아요와 댓글 JOIN이 만드는 곱셈](db-05-aggregate-fanout.md)
- 미션: [M1 목록의 태그 필드와 N+1 점검](../../practice/MISSIONS.md)
- 스키마: [`01-community.sql`](../../docker/mysql/init/01-community.sql)
