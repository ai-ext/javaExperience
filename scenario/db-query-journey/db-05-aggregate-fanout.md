# DB-05. 좋아요와 댓글을 함께 세기 — 1:N JOIN 곱셈 · 중급

<!-- Imagegen 시안 프롬프트: 텍스트 없는 DB 학습 시각화. 한 게시글 노드에서 좋아요 2행과 댓글 3행이 교차해 2×3의 6개 결과 타일을 만드는 팬아웃을 왼쪽에 표현. 오른쪽에는 likes와 comments를 각각 post_id별로 먼저 집계한 두 개의 작은 요약표가 게시글 한 행에 안전하게 붙는 구조. 원시 JOIN의 과대 집계는 주황/빨강, 올바른 사전 집계는 청록/파랑. 밝은 흰 배경, 간결한 데이터 워크벤치, 이미지 내부 글자 없음. -->

<style>
main:has(.db05){max-width:1420px}.db05{--ink:#173253;--muted:#5f7288;--line:#d8e3ef;color:var(--fg)}.db05 *{box-sizing:border-box}.db05 .lead{color:var(--fg);line-height:1.55}.db05 .hero{display:grid;grid-template-columns:1.1fr .9fr;gap:13px;margin:14px 0}.db05 .panel{min-width:0;padding:14px;border:1px solid var(--line);border-radius:15px;background:linear-gradient(150deg,#fff,#f4f8fd);color:var(--ink)}.db05 .panel h2{margin:0 0 8px;color:var(--ink);font-size:.95rem}.db05 .panel p{margin:6px 0;color:var(--muted);font-size:.77rem;line-height:1.5}.db05 .fan{display:grid;grid-template-columns:1fr auto 1.15fr;gap:9px;align-items:center}.db05 .stack{display:flex;flex-direction:column;gap:5px}.db05 .row{padding:7px 8px;border:1px solid #d5e1ed;border-radius:8px;background:#fff;color:#28435f;font:700 .72rem ui-monospace,monospace}.db05 .row.like{border-color:#75cfb5;background:#effbf7}.db05 .row.comment{border-color:#8ebcf4;background:#eff6ff}.db05 .arrow{color:#cc7531;font-size:1.1rem;font-weight:900}.db05 .matrix{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin-top:8px}.db05 .cell{padding:7px 4px;border:1px solid #efc27c;border-radius:7px;background:#fff2da;text-align:center;color:#895019;font:700 .65rem ui-monospace,monospace}.db05 .metric{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}.db05 .metric b{padding:5px 8px;border-radius:8px;background:#fff0d9;color:#98551b;font-size:.74rem}.db05 .metric .good{background:#e8f8f2;color:#08745d}.db05 .sql{overflow:auto;padding:12px;border-radius:11px;background:#11243c;color:#e0edff;font:.74rem/1.55 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.db05 .note{padding:11px 13px;border-left:4px solid #e4a23a;border-radius:9px;background:#fff4d8;color:#624312;line-height:1.5}.db05 details{margin:14px 0}.db05 summary{cursor:pointer;color:#2563eb;font-weight:850}.db05 details[open]>summary{margin-bottom:10px}.db05 table{width:100%;border-collapse:collapse;font-size:.78rem}.db05 th,.db05 td{padding:7px;border-bottom:1px solid #e1e9f1;text-align:left;vertical-align:top}.db05 th{color:#5f7288}@media(max-width:760px){.db05 .hero{grid-template-columns:1fr}.db05 .fan{grid-template-columns:1fr auto 1fr}}@media(max-width:480px){.db05 .fan{grid-template-columns:1fr}.db05 .arrow{transform:rotate(90deg);justify-self:center}.db05 .matrix{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>

<section class="db05" aria-label="좋아요와 댓글을 함께 JOIN할 때 발생하는 행 곱셈과 올바른 집계">
<p class="lead"><a href="db-04-tag-filter-and-exists.html">DB-04</a>에서 한 글이 태그 JOIN 때문에 반복되는 것을 봤습니다. 이번에는 글마다 좋아요와 댓글이 여러 건일 때 두 관계를 동시에 JOIN하면 행 수와 COUNT·SUM이 어떻게 부풀려지는지 봅니다.</p>

<div class="hero" aria-label="좋아요 2개와 댓글 3개가 6개 조합 행으로 증가하는 예시">
  <section class="panel"><h2>① 작은 예시 행을 JOIN하기</h2><p><strong>설명용 합성 데이터</strong>입니다. 특정 practice seed의 글·개수·정답을 뜻하지 않습니다.</p><div class="fan"><div class="stack"><div class="row like">like · 41</div><div class="row like">like · 42</div></div><div class="arrow">×</div><div class="stack"><div class="row comment">comment · 71</div><div class="row comment">comment · 72</div><div class="row comment">comment · 73</div></div></div><div class="matrix" aria-label="2개의 좋아요와 3개의 댓글의 조합"><div class="cell">41 × 71</div><div class="cell">41 × 72</div><div class="cell">41 × 73</div><div class="cell">42 × 71</div><div class="cell">42 × 72</div><div class="cell">42 × 73</div></div><div class="metric"><b>좋아요 실제 2</b><b>댓글 실제 3</b><b>JOIN 결과 6행</b></div></section>
  <section class="panel"><h2>② COUNT와 SUM이 틀어짐</h2><p>원시 행 두 묶음을 게시글 ID만으로 연결하면 각 좋아요가 댓글 3개와, 각 댓글이 좋아요 2개와 짝지어집니다.</p><div class="row">COUNT(pl.id) = 6 · 기대 2</div><div class="row">COUNT(c.id) = 6 · 기대 3</div><div class="row">SUM도 원시 JOIN 행에서 계산하면 반복</div><div class="metric"><b class="good">각 관계를 먼저 한 행으로 집계</b></div></section>
</div>

<div class="note"><strong>행 단위 점검:</strong> JOIN 직후 결과의 한 행은 게시글이 아니라 “좋아요 한 건 × 댓글 한 건”의 조합입니다. 이 상태에서 COUNT나 SUM을 하면 원래 업무 수치와 달라집니다.</div>

## 합성 2×3을 직접 SELECT로 확인하기

아래 CTE는 실제 `post_like`·`comment` 행을 읽거나 수정하지 않습니다. 좋아요 ID 41·42와 댓글 ID 71·72·73을 쿼리 안에서만 만든 **설명용 합성 데이터**입니다. community DB의 SQL 편집기에서 읽기 전용으로 실행하고, 반환된 `(like_id, comment_id)` 여섯 쌍을 위 그림과 대조하세요. 특정 게시글의 실제 집계 결과로 사용하지 않습니다.

<!-- DB05_SYNTHETIC_SQL -->
```sql
WITH sample_likes AS (
    SELECT 41 AS like_id, 'synthetic' AS post_key
    UNION ALL SELECT 42, 'synthetic'
), sample_comments AS (
    SELECT 71 AS comment_id, 'synthetic' AS post_key
    UNION ALL SELECT 72, 'synthetic'
    UNION ALL SELECT 73, 'synthetic'
)
SELECT l.like_id, c.comment_id
FROM sample_likes AS l
JOIN sample_comments AS c ON c.post_key = l.post_key
ORDER BY l.like_id, c.comment_id;
```

두 관계의 행 수는 각각 2와 3인데 JOIN 결과는 6행입니다. 이 쿼리를 실행해 보지 않았다면 여섯 쌍은 **기대값**일 뿐 실제 관찰 결과가 아닙니다.

<details>
<summary>잘못된 쿼리 — 두 1:N 관계를 바로 연결</summary>
<pre class="sql"><code>-- 설명용 구조: 실제 인기 점수 쿼리로 쓰면 안 됩니다.
SELECT
    p.id,
    COUNT(pl.id) AS like_count,
    COUNT(c.id) AS comment_count
FROM post AS p
LEFT JOIN post_like AS pl
    ON pl.post_id = p.id
LEFT JOIN comment AS c
    ON c.post_id = p.id
   AND c.deleted_at IS NULL
GROUP BY p.id;</code></pre>
<p>글 한 개에 좋아요 2개와 살아 있는 댓글 3개가 있으면 집계 입력은 6행입니다. 삭제 댓글 조건은 이 예시에서 제외했지만 곱셈 문제를 해결하지는 않습니다. `COUNT(DISTINCT pl.id)`로 개수를 보정할 수는 있어도, 다른 수치의 SUM·가중치 합산까지 자동으로 고쳐 주지는 않습니다.</p>
</details>

<details>
<summary>안전한 기본형 — 관계마다 먼저 집계한 뒤 JOIN</summary>
<pre class="sql"><code>WITH like_counts AS (
    SELECT post_id, COUNT(*) AS like_count
    FROM post_like
    GROUP BY post_id
), comment_counts AS (
    SELECT post_id, COUNT(*) AS comment_count
    FROM comment
    WHERE deleted_at IS NULL
    GROUP BY post_id
)
SELECT
    p.id,
    COALESCE(lc.like_count, 0) AS like_count,
    COALESCE(cc.comment_count, 0) AS comment_count
FROM post AS p
LEFT JOIN like_counts AS lc
    ON lc.post_id = p.id
LEFT JOIN comment_counts AS cc
    ON cc.post_id = p.id
WHERE p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL;</code></pre>
<p>각 CTE는 `post_id`마다 최대 한 행입니다. 따라서 게시글에 붙일 때 한쪽 집계가 다른 쪽 원시 행 수만큼 반복되지 않습니다. 실제 API에서는 board, visibility, 기간, 커서 등 응답 계약 조건을 추가하고 `COALESCE`로 관계가 없는 글의 0을 만듭니다.</p>
</details>

<details>
<summary>M6 인기글 — 기간 필터를 각 집계 안에 넣기</summary>
<p>M6 점수는 기간 안 좋아요 수 × 3 + 기간 안 살아 있는 댓글 수입니다. 시간 조건이 각각의 원본 테이블에 적용되도록 별도로 집계합니다. 아래는 M6 계약을 옮기는 연습용 뼈대이며, 실제 서버 구현 또는 seed 결과를 주장하지 않습니다.</p>
<pre class="sql"><code>WITH like_counts AS (
    SELECT pl.post_id, COUNT(*) AS likes_in_period
    FROM post_like AS pl
    WHERE pl.created_at &gt;= :since
      AND pl.created_at &lt; :now
    GROUP BY pl.post_id
), comment_counts AS (
    SELECT c.post_id, COUNT(*) AS comments_in_period
    FROM comment AS c
    WHERE c.deleted_at IS NULL
      AND c.created_at &gt;= :since
      AND c.created_at &lt; :now
    GROUP BY c.post_id
)
SELECT
    p.id,
    (COALESCE(lc.likes_in_period, 0) * 3
       + COALESCE(cc.comments_in_period, 0)) AS score
FROM post AS p
LEFT JOIN like_counts AS lc ON lc.post_id = p.id
LEFT JOIN comment_counts AS cc ON cc.post_id = p.id
WHERE p.status = 'PUBLISHED'
  AND p.visibility = 'PUBLIC'
  AND p.deleted_at IS NULL
ORDER BY score DESC, p.published_at DESC, p.id DESC
LIMIT 10;</code></pre>
<p>계약상 인기글은 비로그인 공개 범위로 접근 가능한 글만 대상으로 합니다. 더 복잡한 접근 정책이 추가되면 같은 필터를 적용해야 합니다. 기간은 `[지금 − days, 지금)`이므로 시작 시각은 포함하고 끝 시각은 제외합니다.</p>
</details>

<details>
<summary>M9 활동 요약도 같은 함정이 있다</summary>
<p>회원별 게시글·댓글·받은 좋아요·누른 좋아요 수를 동시에 원시 JOIN하면 서로 독립적인 1:N 관계끼리 행이 곱해집니다. 각각을 `member_id` 또는 기준 회원 키로 먼저 집계한 뒤 회원 테이블에 LEFT JOIN하면 활동이 없는 회원도 0으로 표현할 수 있습니다.</p>
<div class="metric"><b>게시글 집계 → 회원당 1행</b><b>댓글 집계 → 회원당 1행</b><b>좋아요 집계 → 회원당 1행</b><b class="good">마지막에 member와 결합</b></div>
</details>
</section>

## 디버깅할 때 순서

1. 각 테이블의 원본 행 수를 게시글별로 따로 세어 기대값을 적습니다.
2. 조인을 하나씩 추가할 때 결과 행 수를 확인합니다.
3. 한 게시글이 여러 행이면 현재 결과의 한 행이 무엇을 뜻하는지 말로 적습니다.
4. 여러 1:N 관계를 집계한다면 각 관계를 먼저 그룹화하고, 집계 결과를 붙입니다.
5. `COUNT(DISTINCT ...)`는 필요한 경우의 보정입니다. 서로 다른 SUM·가중치 점수가 왜곡되는 구조를 대신 설명해 주지 않습니다.

## 미션과 연결

- [M6 — 인기글](../../practice/MISSIONS.md): 최근 기간의 좋아요·댓글 점수, 삭제 댓글 제외, 점수 동점 정렬.
- [M9-1 — 회원별 활동 요약](../../practice/MISSIONS.md): 각 활동 집계와 활동 없는 회원 30을 0으로 표시.
- [M9-5 — 태그별 최근 30일 집계](../../practice/MISSIONS.md): 태그·게시글·좋아요 집계의 행 단위를 확인.
- [M10-1 — 목록 쿼리 수와 N+1](../../practice/MISSIONS.md): 조인 집계와 API 조회 수는 서로 다른 성능 문제.

## 다음 단계

- 이전: [DB-04 — 태그 JOIN 중복과 EXISTS](db-04-tag-filter-and-exists.md)
- 다음: [DB-06 — EXISTS와 NOT EXISTS](db-06-exists-not-exists.md)
- 실제 테이블 제약: [`01-community.sql`](../../docker/mysql/init/01-community.sql)
