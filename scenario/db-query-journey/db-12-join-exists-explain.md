# DB-12. 같은 API 조건을 JOIN·EXISTS로 쓰고 실행 계획 읽기 — 중급

<style>
main:has(.db12){max-width:1500px}.db12{--ink:#172d50;--muted:#60738a;--line:#d8e3f0;color:var(--fg)}.db12 *{box-sizing:border-box}.db12 .lead{line-height:1.55}.db12 .contract{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:11px 14px;border:1px solid #93c5fd;border-radius:14px;background:linear-gradient(100deg,#eff6ff,#f0fdfa);color:#13294b}.db12 .method{padding:5px 9px;border-radius:8px;background:#d1fae5;color:#087857;font-weight:900}.db12 .path{font:800 .85rem ui-monospace,monospace;overflow-wrap:anywhere}.db12 .flow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin:14px 0}.db12 .step{position:relative;min-width:0;padding:13px;border:1px solid var(--line);border-radius:15px;background:linear-gradient(150deg,#fff,#f4f8ff)}.db12 .step:nth-child(2){background:linear-gradient(150deg,#fff,#effbf8)}.db12 .step:nth-child(3){background:linear-gradient(150deg,#fff,#fff8eb)}.db12 .step:nth-child(4){background:linear-gradient(150deg,#fff,#f4f0ff)}.db12 .step:not(:last-child):after{content:'→';position:absolute;right:-16px;top:46%;z-index:2;color:#0d9bad;font-size:1.2rem;font-weight:900}.db12 h2{margin:0 0 7px;font-size:.92rem;color:var(--ink)}.db12 .step p{font-size:.77rem;line-height:1.5;color:var(--muted)}.db12 .chip{display:inline-block;margin:2px;padding:4px 6px;border:1px solid #d7e2ee;border-radius:7px;background:#fff;color:#344c6c;font:700 .66rem ui-monospace,monospace}.db12 pre{overflow:auto;padding:12px;border-radius:11px;background:#11243c;color:#e0edff;font:.72rem/1.55 ui-monospace,monospace;white-space:pre-wrap}.db12 .note{padding:11px 13px;border-left:4px solid #e4a23a;border-radius:9px;background:#fff4d8;color:#603d11;line-height:1.55}.db12 details{margin:15px 0}.db12 summary{cursor:pointer;color:#2563eb;font-weight:850}.db12 .panel{margin-top:10px;padding:13px;border:1px solid var(--line);border-radius:13px;background:var(--card);line-height:1.55}@media(max-width:850px){.db12 .flow{grid-template-columns:repeat(2,minmax(0,1fr))}.db12 .step:nth-child(2):after{content:'↓';right:48%;top:auto;bottom:-16px}}@media(max-width:520px){.db12 .flow{grid-template-columns:1fr;gap:9px}.db12 .step:not(:last-child):after,.db12 .step:nth-child(2):after,.db12 .step:nth-child(3):after{content:'↓';right:48%;top:auto;bottom:-15px}.db12 pre{font-size:.66rem}}
.db12 .compare-title{display:flex;align-items:center;gap:10px;margin:16px 0 9px}.db12 .compare-title h2{margin:0;font-size:1rem;color:#dcecff}.db12 .compare-title span{padding:4px 8px;border:1px solid #c8d8eb;border-radius:99px;background:#f4f8ff;color:#506580;font-size:.68rem;font-weight:800}.db12 .compare{display:grid;grid-template-columns:minmax(0,1fr) 48px minmax(0,1fr);align-items:stretch;gap:10px}.db12 .query-card{min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:15px;background:linear-gradient(155deg,#fff,#f4f8ff);box-shadow:0 5px 18px #18365c0a}.db12 .query-card.exists{background:linear-gradient(155deg,#fff,#effbf8)}.db12 .query-head{display:flex;align-items:center;gap:9px;padding:10px 13px;border-bottom:1px solid var(--line);background:#edf5ff}.db12 .exists .query-head{background:#e5faf4}.db12 .query-head b{color:var(--ink);font-size:.88rem}.db12 .query-head small{margin-left:auto;color:var(--muted);font-size:.67rem}.db12 .query-icon{display:grid;width:28px;height:28px;place-items:center;border-radius:9px;background:#dbeafe;color:#1456ac;font-weight:950}.db12 .exists .query-icon{background:#c9f4e6;color:#087e67}.db12 .query-body{padding:11px 13px}.db12 .query-body p{margin:0 0 7px;color:var(--muted);font-size:.75rem;line-height:1.45}.db12 .query-body pre{margin:7px 0 0;padding:9px;font-size:.68rem}.db12 .versus{align-self:center;display:grid;place-items:center;width:40px;height:40px;border:1px solid #c8d8eb;border-radius:50%;background:#fff;color:#45617f;font-size:.68rem;font-weight:900;box-shadow:0 3px 12px #18365c12}.db12 .result-gate{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;margin-top:10px;padding:11px 13px;border:1px solid #f0d18a;border-radius:13px;background:linear-gradient(100deg,#fff9e9,#fff);color:#493915}.db12 .gate-copy b{display:block;font-size:.78rem}.db12 .gate-copy p{margin:3px 0 0;font-size:.7rem;line-height:1.45;color:#705b2b}.db12 .gate-state{display:flex;align-items:center;gap:6px;white-space:nowrap;padding:6px 9px;border:1px solid #e9c36f;border-radius:99px;background:#fff4d1;color:#805500;font-size:.68rem;font-weight:900}.db12 .gate-state:before{content:'•';font-size:1.2rem;line-height:.5}@media(max-width:650px){.db12 .compare{grid-template-columns:minmax(0,1fr);gap:8px}.db12 .versus{width:auto;height:25px;justify-self:center;padding:0 10px;border-radius:99px}.db12 .versus:after{content:'↓';margin-left:5px;color:#0d9bad}.db12 .result-gate{grid-template-columns:1fr;gap:8px}.db12 .gate-state{justify-self:start}}</style>

<section class="db12" aria-label="API 조건을 JOIN과 EXISTS로 표현하고 실행 계획을 읽는 흐름">
<p class="lead"><a href="db-01-response-to-query.html">DB-01</a>에서 응답 필드를 테이블로 연결했고, <a href="db-06-exists-not-exists.html">DB-06</a>에서 행의 존재 여부를 썼습니다. 이번에는 그 조건을 <strong>JOIN과 EXISTS 두 방식으로 만들고, 같은 데이터에서 계획과 실제 실행을 비교</strong>합니다.</p>
<div class="contract"><span class="method">GET</span><span class="path">/api/me/likes · M3</span><span>좋아요 행 + 게시글 가시성 조건</span><span class="chip">추가 연습: 목록에서 tag 필터</span></div>
<div class="compare-title"><h2>같은 조건, 두 가지 SQL 표현</h2><span>예시 모양 · 아직 실행 전</span></div>
<div class="compare" aria-label="좋아요 목록의 JOIN 표현과 EXISTS 표현을 나란히 비교">
  <section class="query-card join">
    <div class="query-head"><span class="query-icon" aria-hidden="true">J</span><b>JOIN · 행을 연결</b><small>게시글 조건을 붙임</small></div>
    <div class="query-body"><p>좋아요 행에 게시글을 연결한 뒤, 게시글 공개 조건으로 거릅니다.</p><pre><code>post_like l
JOIN post p
  ON p.id = l.post_id
WHERE l.member_id = :memberId
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL</code></pre></div>
  </section>
  <div class="versus" aria-hidden="true">비교</div>
  <section class="query-card exists">
    <div class="query-head"><span class="query-icon" aria-hidden="true">?</span><b>EXISTS · 있는지 질문</b><small>관계 존재만 확인</small></div>
    <div class="query-body"><p>좋아요 행마다 조건에 맞는 게시글이 존재하는지만 확인합니다.</p><pre><code>post_like l
WHERE l.member_id = :memberId
  AND EXISTS (
    SELECT 1 FROM post p
    WHERE p.id = l.post_id
      AND p.status = 'PUBLISHED'
      AND p.deleted_at IS NULL
  )</code></pre></div>
  </section>
</div>
<div class="result-gate" role="note" aria-label="EXPLAIN 전에 결과 일치 여부를 확인하는 체크포인트">
  <div class="gate-copy"><b>먼저 결과가 같은지 확인하세요</b><p>같은 memberId·필터·정렬·LIMIT으로 실행하고 <code>like_id</code>, <code>post_id</code>, <code>liked_at</code> 값과 순서가 일치할 때만 다음 단계로 갑니다. 일치 확인 뒤 두 쿼리의 실행 계획을 비교합니다.</p></div>
  <span class="gate-state">미측정 · 확인 대기</span>
</div>
<div class="flow" aria-label="요청 조건에서 실행 계획을 확인하는 네 단계">
  <section class="step"><h2>① API 결과를 고정</h2><p>같은 회원·같은 게시글 가시성·같은 정렬 조건을 두 쿼리에 적용합니다.</p><span class="chip">M3: 좋아요 시각 DESC</span><span class="chip">R1: 볼 수 없는 글 제외</span></section>
  <section class="step"><h2>② 관계를 표현</h2><p>JOIN은 행을 붙이고, EXISTS는 관계 행이 있는지만 질문합니다.</p><span class="chip">post_like ↔ post</span><span class="chip">post ↔ post_tag ↔ tag</span></section>
  <section class="step"><h2>③ 결과가 같은지 비교</h2><p>양쪽 결과의 좋아요 ID와 순서가 같아야 공정한 비교입니다.</p><span class="chip">중복 행</span><span class="chip">NULL</span><span class="chip">정렬 키</span></section>
  <section class="step"><h2>④ EXPLAIN으로 관찰</h2><p>추정 계획과 실제 실행을 분리해 기록합니다. 측정값은 환경에서 직접 얻습니다.</p><span class="chip">key · rows</span><span class="chip">loops · actual rows</span></section>
</div>
</section>

## 비교 전 API와 데이터 범위 정하기

`GET /api/me/likes`는 좋아요한 시각의 내림차순으로 정렬하고, 지금 볼 수 없는 글을 제외합니다([M3](../../practice/MISSIONS.md)). 실행 계획 비교에서는 먼저 **같은 입력 회원, 같은 응답 열, 같은 권한 조건, 같은 정렬·LIMIT**을 사용하세요. 아래는 읽기 전용 SQL 모양을 익히는 예시입니다. M3의 전체 권한 규칙(R1 중 팔로워·차단·운영자 예외 포함)을 완성한 서비스 SQL이라고 주장하지 않습니다. 전체 R1을 적용할 때 두 쿼리의 필터가 반드시 같은지 확인해야 합니다.

`practice` 연결은 시드 규모가 작아 JOIN과 EXISTS의 계획이 같거나 차이가 거의 없을 수 있습니다. 계획 차이가 보이지 않아도 쿼리가 잘못됐다는 뜻은 아닙니다. 데이터량이 계획 선택을 바꾸는 경험은 [DB-10 격리 성능 실습](DB-10-performance-fixture.md)에서 합니다.

## 좋아요 목록: JOIN으로 게시글 조건 붙이기

아래는 로그인 회원의 좋아요에서 공개 게시글만 남기는 **조건 예시**입니다. `12`는 실습 회원 예시 값입니다. 완전한 M3/R1 쿼리는 팔로워 공개·차단·작성자 규칙을 추가로 반영해야 합니다.

```sql
SELECT l.id AS like_id, l.post_id, l.created_at AS liked_at
FROM post_like AS l
JOIN post AS p ON p.id = l.post_id
WHERE l.member_id = 12
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
  AND p.visibility = 'PUBLIC'
ORDER BY l.created_at DESC, l.id DESC
LIMIT 21;
```

이 실습에서 JOIN은 좋아요 행에 해당 게시글 상태를 붙입니다. `post_like.post_id`는 게시글 하나를 가리키므로 이 관계만으로 좋아요 행이 늘어나지 않습니다. 목록 응답에서 작성자나 태그를 붙이는 JOIN은 별도 관계이며, 태그처럼 한 게시글에 여러 행이 있으면 결과가 늘어날 수 있습니다.

같은 조건을 “해당 게시글이 존재하는가?”로 적으면 다음과 같습니다. 두 쿼리의 `like_id`, `post_id`, `liked_at`과 순서를 대조하고 각 쿼리 앞에 `EXPLAIN`을 붙여 계획도 비교하세요.

```sql
SELECT l.id AS like_id, l.post_id, l.created_at AS liked_at
FROM post_like AS l
WHERE l.member_id = 12
  AND EXISTS (
      SELECT 1
      FROM post AS p
      WHERE p.id = l.post_id
        AND p.status = 'PUBLISHED'
        AND p.deleted_at IS NULL
        AND p.visibility = 'PUBLIC'
  )
ORDER BY l.created_at DESC, l.id DESC
LIMIT 21;
```

여기서 `EXISTS`는 게시글의 표시 필드를 붙이지 않고, 공개 조건을 만족하는 게시글이 있는 좋아요만 남깁니다. 다만 실제 M3는 전체 R1을 적용해야 하므로 이 단순 공개 조건 두 쿼리의 동일성만으로 실제 API 권한 구현을 완료했다고 볼 수 없습니다.

## 태그 필터: JOIN과 EXISTS 결과 비교

M1 응답은 글의 `tags[]`를 포함합니다. 다음은 그 응답을 확장해 “태그가 spring인 글만 반환”하는 쿼리 설계 연습입니다. 기존 M1 API가 `tag` query parameter를 제공한다고 가정하지 않습니다. 두 쿼리는 게시글 ID를 반환하며 동일한 `boardSlug`, 상태·삭제·가시성 조건을 추가해 비교할 수 있습니다.

```sql
-- JOIN: 태그 관계를 결과 집합에 붙여 필터
SELECT p.id
FROM board AS b
JOIN post AS p ON p.board_id = b.id
JOIN post_tag AS pt ON pt.post_id = p.id
JOIN tag AS t ON t.id = pt.tag_id
WHERE b.slug = 'dev'
  AND t.name = 'spring'
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
  AND p.visibility = 'PUBLIC'
ORDER BY p.published_at DESC, p.id DESC;
```

```sql
-- EXISTS: 태그 행이 있는지 질문. 결과 행에 태그를 붙이지 않음
SELECT p.id
FROM board AS b
JOIN post AS p ON p.board_id = b.id
WHERE b.slug = 'dev'
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
  AND p.visibility = 'PUBLIC'
  AND EXISTS (
      SELECT 1
      FROM post_tag AS pt
      JOIN tag AS t ON t.id = pt.tag_id
      WHERE pt.post_id = p.id
        AND t.name = 'spring'
  )
ORDER BY p.published_at DESC, p.id DESC;
```

`tag.name`은 UNIQUE이고 `(post_id, tag_id)`는 `post_tag`의 복합 기본 키입니다. 따라서 이 필터에서는 태그 하나당 게시글이 두 번씩 매칭되지는 않습니다. 여러 태그를 한꺼번에 JOIN하거나 집계하는 쿼리라면 결과 행 수를 확인하고, 필터 목적이면 `EXISTS`가 중복을 만들지 않는다는 점도 비교하세요.

## EXPLAIN을 직접 실행하고 기록하기

먼저 좋아요 JOIN/EXISTS 쌍과 태그 JOIN/EXISTS 쌍 각각의 결과 ID를 비교해 의미가 같은지 확인합니다. 그다음 네 SELECT에 `EXPLAIN FORMAT=TREE` 또는 `EXPLAIN`을 붙여 추정 계획을 읽습니다. 대표로 아래 태그 EXISTS 쿼리에 `EXPLAIN ANALYZE`도 실행해 실제 계획을 확인합니다. MySQL 8.4의 `EXPLAIN ANALYZE`는 SELECT를 실제 실행하면서 행·loop·시간을 보여 줍니다. 결과 숫자는 seed·통계·버전에 따라 달라지므로 이 문서에는 정답 수치를 적지 않습니다.

```sql
EXPLAIN FORMAT=TREE
SELECT p.id
FROM board AS b
JOIN post AS p ON p.board_id = b.id
WHERE b.slug = 'dev'
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
  AND p.visibility = 'PUBLIC'
  AND EXISTS (
      SELECT 1
      FROM post_tag AS pt
      JOIN tag AS t ON t.id = pt.tag_id
      WHERE pt.post_id = p.id AND t.name = 'spring'
  )
ORDER BY p.published_at DESC, p.id DESC;

EXPLAIN ANALYZE
SELECT p.id
FROM board AS b
JOIN post AS p ON p.board_id = b.id
WHERE b.slug = 'dev'
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
  AND p.visibility = 'PUBLIC'
  AND EXISTS (
      SELECT 1
      FROM post_tag AS pt
      JOIN tag AS t ON t.id = pt.tag_id
      WHERE pt.post_id = p.id AND t.name = 'spring'
  )
ORDER BY p.published_at DESC, p.id DESC;
```

CloudBeaver의 `practice (학습용)` 연결에서 읽기 쿼리로 실행합니다. 기본 seed의 테이블·인덱스는 바꾸지 않습니다. `EXPLAIN ANALYZE`도 실제 SELECT를 수행하므로 변경 쿼리에 붙이지 마세요.

| 관찰 항목 | 실행 계획에서 찾을 것 |
|---|---|
| 접근 경로 | 어떤 테이블이 먼저 읽히고 `key` 또는 index lookup이 무엇인지 |
| 추정과 실제 | 추정 `rows`와 actual rows가 크게 다른 구간이 있는지 |
| 반복 | `loops`가 어느 연산에서 커지는지 |
| 정렬·임시 결과 | sort, temporary table 같은 추가 작업이 있는지 |
| 결과 정확성 | JOIN과 EXISTS의 ID·순서가 같은지, 중복이 생겼는지 |

<details>
<summary>계획이 다르지 않을 때 다음에 할 일</summary>
<section class="panel">
MySQL 옵티마이저는 JOIN과 서브쿼리를 내부적으로 비슷한 계획으로 바꿀 수 있습니다. 문법 모양만 보고 어느 쪽이 빠르다고 결론내리지 말고, 같은 스키마와 데이터에서 결과 정확성·계획·실행을 비교합니다. 표본이 작으면 의미 있는 차이가 나오지 않을 수 있습니다. 그때는 값을 기록하고 DB-10의 격리 fixture로 이동합니다. fixture는 이 API의 모든 JOIN과 권한 조건을 재현하지 않으므로, 결과는 “좋아요 목록용 정렬 인덱스”에만 적용합니다.
</section>
</details>

## 연결

- 기능 계약: [M1 목록의 태그 응답](../../practice/MISSIONS.md) · [M3 내가 좋아요한 글](../../practice/MISSIONS.md)
- 선행: [DB-03 JOIN](db-03-detail-join.md) · [DB-06 EXISTS·NOT EXISTS](db-06-exists-not-exists.md) · [DB-10 격리 EXPLAIN 실습](DB-10-performance-fixture.md)
- 다음: DB-13에서 같은 목록 API의 Controller → Service → Repository → SQL 경로와 N+1 계측을 잇습니다.
