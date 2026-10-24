# DB-14. 실제 스키마에서 느린 목록 쿼리까지 — 실습

<style>
main:has(.db14){max-width:1480px}.db14{--ink:#172d50;--muted:#60738a;--line:#d8e3f0;color:var(--fg)}.db14 *{box-sizing:border-box}.db14 .lead{line-height:1.55}.db14 .contract{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:11px 14px;border:1px solid #93c5fd;border-radius:14px;background:linear-gradient(100deg,#eff6ff,#f0fdfa);color:#13294b}.db14 .method{padding:5px 9px;border-radius:8px;background:#d1fae5;color:#087857;font-weight:900}.db14 .path{font:800 .85rem ui-monospace,monospace;overflow-wrap:anywhere}.db14 .columns{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:14px 0}.db14 .column{min-width:0;padding:13px;border:1px solid var(--line);border-radius:15px;background:linear-gradient(155deg,#fff,#f5f9ff)}.db14 .column:nth-child(2){background:linear-gradient(155deg,#fff,#f0fbf8)}.db14 .column:nth-child(3){background:linear-gradient(155deg,#fff,#f7f4ff)}.db14 .column h2{margin:0 0 8px;font-size:.9rem;color:var(--ink)}.db14 .column p,.db14 .column li{font-size:.79rem;line-height:1.45;color:var(--muted)}.db14 .schema{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:6px;align-items:center;margin:9px 0}.db14 .table-card{padding:8px;border:1px solid #cbd9ea;border-radius:10px;background:#fff;font:.72rem/1.55 ui-monospace,monospace;color:#344c6c}.db14 .table-card b{display:block;margin-bottom:3px;color:#163d70;font:800 .76rem system-ui,sans-serif}.db14 .fk{padding:3px 5px;border-radius:6px;background:#dbeafe;color:#174c90;font-weight:800}.db14 .link{font-size:.62rem;line-height:1.3;text-align:center;color:#087e83;font-weight:800}.db14 .link:before{content:'← FK →';display:block;font-size:.66rem}.db14 .req{display:grid;grid-template-columns:82px 1fr;gap:5px;padding:6px 0;border-bottom:1px solid var(--line);font-size:.78rem;line-height:1.4}.db14 .req b{color:#174c72}.db14 .inspector{padding:9px;border:1px solid #d4deeb;border-radius:10px;background:#fff}.db14 .tree{padding:8px;border-radius:7px;background:#f0f5fb;color:#36516f;font:.72rem/1.8 ui-monospace,monospace}.db14 .tabs{display:flex;gap:4px;flex-wrap:wrap;margin:8px 0}.db14 .tab{padding:4px 6px;border:1px solid #d8e3f0;border-radius:6px;background:#fff;color:#536780;font-size:.7rem}.db14 .req code,.db14 .column p code{background:#e8f0fb;color:#174c80;padding:2px 4px;border-radius:4px;white-space:normal;overflow-wrap:anywhere}.db14 .tab.active{border-color:#0ba5bd;background:#e4faff;color:#075985;font-weight:800}.db14 .flow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:12px 0}.db14 .step{position:relative;min-width:0;padding:10px;border:1px solid var(--line);border-radius:12px;background:#fff}.db14 .step:not(:last-child):after{content:'›';position:absolute;right:-10px;top:34%;z-index:2;color:#0d9bad;font-size:1.2rem;font-weight:900}.db14 .step b{display:block;margin-bottom:4px;color:var(--ink);font-size:.8rem}.db14 .step span{display:block;color:var(--muted);font-size:.72rem;line-height:1.4}.db14 .badge{display:inline-block;padding:5px 9px;border-radius:99px;background:#e0f2fe;color:#075985;font-size:.7rem;font-weight:900}.db14 .warning{padding:10px 12px;border-left:4px solid #e4a23a;border-radius:9px;background:#fff4d8;color:#603d11;font-size:.82rem;line-height:1.5}.db14 .plan-check{display:grid;grid-template-columns:1fr 1fr auto;gap:9px;align-items:stretch;margin:12px 0}.db14 .plan-card{padding:10px;border:1px solid #f2c38a;border-radius:11px;background:#fff8ef}.db14 .plan-card.after{border-color:#8bd8c5;background:#effbf7}.db14 .plan-card b{display:block;margin-bottom:4px;color:#70400b;font-size:.75rem}.db14 .plan-card.after b{color:#087857}.db14 .plan-card span{font-size:.68rem;line-height:1.45;color:#6a6257}.db14 .same-result{align-self:center;padding:7px 9px;border:1px solid #cbd9ea;border-radius:99px;background:#fff;color:#23486d;font-size:.66rem;font-weight:900;white-space:nowrap}.db14 pre{overflow:auto;padding:12px;border-radius:11px;background:#11243c;color:#e0edff;font:.72rem/1.55 ui-monospace,monospace;white-space:pre-wrap}.db14 details{margin:15px 0}.db14 summary{cursor:pointer;color:#2563eb;font-weight:850}.db14 .panel{margin-top:10px;padding:13px;border:1px solid var(--line);border-radius:13px;background:var(--card);line-height:1.55}@media(max-width:900px){.db14 .columns{grid-template-columns:1fr 1fr}.db14 .column:last-child{grid-column:1/-1}.db14 .flow{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:650px){.db14 .columns,.db14 .flow{grid-template-columns:1fr;gap:8px}.db14 .column:last-child{grid-column:auto}.db14 .schema{grid-template-columns:1fr}.db14 .link:before{content:'↕ FK ↕'}.db14 .plan-check{grid-template-columns:1fr}.db14 .same-result{justify-self:center}.db14 pre{font-size:.66rem}}
</style>

<section class="db14" aria-label="DBeaver에서 실제 스키마를 조사해 느린 쿼리를 개선하는 실습">
<p class="lead">문서에 적힌 테이블 이름을 먼저 믿지 말고, <strong>DB에 접속해 현재 스키마를 읽은 다음 API 요구사항을 SQL로 옮기세요.</strong> 실행 결과와 계획을 기록하고 인덱스를 추가한 뒤, 결과가 그대로인지 확인하고 실습 DB를 원래 상태로 돌립니다.</p>
<div class="contract"><span class="badge">격리 fixture · 실습용 데이터</span><span>CloudBeaver 또는 DBeaver</span><span>MySQL 8.4</span><span class="method">GET</span><span class="path">/api/boards/board-03/posts?size=20</span></div>
<div class="columns" aria-label="스키마 관계, API 요구사항, DB 클라이언트 관찰의 세 열">
<section class="column"><h2>① 실제 관계 · FK와 열 이름 구분</h2><p><strong>FK</strong> 표시는 DB 제약으로 확인한 관계입니다. <code>board_id</code>, <code>author_id</code>는 열 이름이고, FK 제약의 유무는 <code>SHOW CREATE TABLE</code>로 판별합니다.</p><div class="schema"><div class="table-card"><b>board</b><span class="fk">id · PK</span><br>slug · UNIQUE<br>name</div><div class="table-card"><b>post</b><span class="fk">id · PK</span><br><span class="fk">board_id · FK</span><br><span class="fk">author_id · FK</span><br>title · status<br>created_at · deleted_at</div><div class="table-card"><b>member</b><span class="fk">id · PK</span><br>nickname</div></div><div class="schema"><div class="link">board.id ← post.board_id<br><small>FK 제약</small></div><div class="link">두 FK는 post에 선언됨</div><div class="link">member.id ← post.author_id<br><small>FK 제약</small></div></div><p>화살표는 관계를 보여 주며, 값만 우연히 같은 열은 FK라고 부르지 않습니다.</p></section>
<section class="column"><h2>② 요구사항 → 쿼리 조건</h2><div class="req"><b>URL slug</b><span><code>board.slug='board-03'</code><br><code>JOIN post ON board_id</code></span></div><div class="req"><b>응답 필드</b><span><code>post.id, title, created_at</code><br><code>JOIN member → nickname</code></span></div><div class="req"><b>발행·삭제</b><span><code>status='PUBLISHED'</code><br><code>deleted_at IS NULL</code></span></div><div class="req"><b>최신 20개</b><span><code>ORDER BY created_at DESC, id DESC</code><br><code>LIMIT 20</code></span></div><p>정렬의 전체 키까지 인덱스 후보 설계에 반영합니다.</p></section>
<section class="column"><h2>③ DBeaver / CloudBeaver에서 보기</h2><div class="inspector"><div class="tree">▾ javaexperience_perf<br>　▾ Tables<br>　　▸ board<br>　　▾ post　<span class="badge">선택</span><br>　　▸ member</div><div class="tabs"><span class="tab active">Columns</span><span class="tab">Indexes</span><span class="tab">Foreign Keys</span><span class="tab">Data</span></div><p>테이블을 선택해 실제 열·인덱스·FK 탭을 확인합니다. 이 그림은 탐색 순서이며 특정 실행 결과를 대신하지 않습니다.</p></div></section>
</div>
<div class="flow" aria-label="연결부터 원상 복구까지 다섯 단계">
<section class="step"><b>1 · 연결</b><span>격리 DB 선택, schema 확인</span></section><section class="step"><b>2 · 탐색</b><span>DDL·열·인덱스·FK 관찰</span></section><section class="step"><b>3 · 실행</b><span>요구를 SQL로, 결과·계획 기록</span></section><section class="step"><b>4 · 비교</b><span>인덱스 전후 같은 쿼리 실행</span></section><section class="step"><b>5 · 복구</b><span>실험 인덱스 DROP, 확인</span></section>
</div>
<p class="warning"><strong>격리 경계:</strong> 이 연습은 <code>tools/db-perf-fixture.sh</code>가 만든 <code>javaexperience_perf</code>만 사용합니다. 앱의 <code>practice</code> DB, CloudBeaver의 학습용 연결, compose 데이터에는 DDL을 실행하지 마세요. 여기의 응답 계약은 쿼리 설계 연습이며 서버 API가 구현됐거나 실제 API를 호출한다는 뜻은 아닙니다.</p>
</section>

## 1. 격리된 데이터베이스에 접속

저장소 루트에서 disposable fixture를 시작합니다. 이미 실행 중인 컨테이너의 데이터는 `up`이 보존합니다.

```bash
tools/db-perf-fixture.sh up
tools/db-perf-fixture.sh status
```

CloudBeaver 또는 DBeaver에서 MySQL 연결을 만들거나 기존 연결을 복제합니다. DBeaver Desktop은 호스트 OS에서 실행되므로 `127.0.0.1`에 접속합니다. CloudBeaver는 컨테이너 안에서 실행되므로 그 컨테이너의 `127.0.0.1`은 CloudBeaver 자신입니다. Mac의 Docker 런타임에서는 보통 `host.docker.internal`을 사용합니다. 쓰는 런타임에서 이 이름이 해석되지 않으면 호스트 OS의 DBeaver Desktop으로 `127.0.0.1`에 접속합니다.

| 항목 | 값 |
|---|---|
| Host | DBeaver Desktop: `127.0.0.1` · CloudBeaver 컨테이너(Mac): `host.docker.internal` |
| Port | `13319` (스크립트 실행 시 `PERF_DB_PORT`로 변경 가능) |
| Database | `javaexperience_perf` |
| User | `root` |
| Password | 기본값 `perf-local-only` 또는 직접 설정한 `PERF_DB_ROOT_PASSWORD` |

연결 뒤 좌측 navigator에서 **`javaexperience_perf`가 선택됐는지** 확인합니다. 아래 SQL도 현재 연결과 선택 schema가 맞는지 먼저 확인합니다.

```sql
SELECT DATABASE() AS selected_schema, VERSION() AS mysql_version;
SHOW TABLES;
```

**기준 확인:** 확장 fixture는 `board`, `member`, `post`, `post_like`, `tag`, `post_tag`, `comment`를 포함합니다. SQL로 실제 테이블·열·인덱스·FK를 확인하고, 보이지 않는 요소가 있으면 생성 스크립트 버전과 연결 대상을 먼저 점검하세요. 확장 schema가 들어오기 전 fixture에서는 이 문서의 게시판 목록 쿼리를 실행할 수 없습니다.

## 2. 스키마를 직접 조사

먼저 데이터베이스에서 확인되는 테이블을 기록하고, API 요구사항에 필요한 테이블의 정의를 읽습니다. `SHOW CREATE TABLE` 결과에는 열 정의, 기본키, 인덱스, FK가 함께 나옵니다.

```sql
SHOW CREATE TABLE board;
SHOW CREATE TABLE member;
SHOW CREATE TABLE post;
SHOW CREATE TABLE post_like;
SHOW CREATE TABLE tag;
SHOW CREATE TABLE post_tag;
SHOW CREATE TABLE `comment`;
```

특정 테이블이 없다는 오류가 나면 중단하고 `SHOW TABLES`로 실제 fixture 범위를 확인하세요. 전체 열과 인덱스를 결과 그리드로 빠르게 훑으려면 다음 쿼리를 씁니다.

```sql
SELECT table_name, ordinal_position, column_name, column_type, is_nullable,
       column_key, extra
FROM information_schema.columns
WHERE table_schema = DATABASE()
ORDER BY table_name, ordinal_position;

SELECT table_name, index_name, non_unique, seq_in_index, column_name,
       collation, cardinality
FROM information_schema.statistics
WHERE table_schema = DATABASE()
ORDER BY table_name, index_name, seq_in_index;
```

FK는 자식 열에서 부모 열로 연결해 읽습니다. FK가 없으면 결과에 관계가 안 나타날 수 있습니다. 그런 경우 스키마의 실제 키와 앱 계약을 확인하고, 이름만 비슷하다고 관계를 단정하지 마세요.

```sql
SELECT table_name AS child_table, column_name AS child_column,
       referenced_table_name AS parent_table,
       referenced_column_name AS parent_column,
       constraint_name
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE()
  AND referenced_table_name IS NOT NULL
ORDER BY table_name, constraint_name, ordinal_position;
```

### 요구 스키마와 실제 DDL 맞추기

| 기능 요구 | DB에서 확인할 정의 | 확인 위치 |
|---|---|---|
| URL의 게시판 slug는 중복되지 않는다 | `board.slug`의 UNIQUE | `SHOW CREATE TABLE board`·Indexes |
| 글은 한 게시판과 작성 회원에 속한다 | `post.board_id → board.id`, `post.author_id → member.id` FK | `SHOW CREATE TABLE post`·Foreign Keys |
| 글은 발행 상태와 삭제 여부로 걸러진다 | `post.status NOT NULL`, `post.deleted_at NULL` | Columns |
| 같은 회원이 같은 글에 좋아요를 두 번 저장하지 않는다 | `post_like(member_id, post_id)` UNIQUE | `SHOW CREATE TABLE post_like`·Indexes |
| 태그와 댓글은 글에 연결된다 | `post_tag.post_id`, `comment.post_id` FK | Foreign Keys |

각 행을 실제 DDL과 대조해 일치·불일치를 표시하세요. 불일치하면 API 쿼리를 진행하기 전에 접속한 DB와 fixture 버전부터 확인합니다. 이 단계에서는 테이블을 임의로 바꾸지 않습니다.

### 관찰 기록

| 확인할 것 | DB에서 적어 둘 값 |
|---|---|
| 접속 대상 | `DATABASE()` 결과, 서버 버전 |
| 테이블·열 | 실제 존재하는 테이블, 응답에 필요한 열과 NULL 여부 |
| 인덱스 | 각 인덱스의 이름과 열 순서, UNIQUE 여부 |
| 관계 | FK의 자식 열 → 부모 열, FK가 없는 관계 후보 |
| 불확실한 부분 | DDL만으로 알 수 없는 의미나 응답 규칙 — API 계약에서 추가 확인 |

## 3. API 요구사항을 쿼리 조건으로 바꾸기

이 연습의 고정 계약은 `board-03`의 발행된 게시글 목록입니다. `PUBLISHED`이고 삭제되지 않은 글에서 응답에 필요한 글 ID·제목·작성자 닉네임·작성 시각을 가져오고 최신 글부터 최대 20개를 반환한다고 가정합니다. `visibility`에 따른 공개 범위 판정은 이 쿼리의 범위 밖입니다. 실제 DB 스키마에서 해당 필드와 관계를 찾아 체크하세요.

| 요구사항 | SQL 설계 질문 | 이 실습의 설계 |
|---|---|---|
| 게시판 범위 | slug를 어디서 찾고 게시글과 어떻게 연결하는가? | `board.slug = 'board-03'` → `post.board_id` |
| 발행 상태 | 어떤 값이 발행되고 삭제되지 않은 상태인가? | `post.status = 'PUBLISHED'`, `deleted_at IS NULL` |
| 응답 필드 | 어떤 관계를 거쳐 작성자 닉네임을 얻는가? | 게시글 → 작성 회원 |
| 정렬 | 같은 시각의 순서도 고정하는가? | `created_at DESC, id DESC` |
| 페이지 크기 | 다음 페이지 확인을 위해 여분 행이 필요한가? | 여기서는 첫 20행 확인, `LIMIT 20` |
| 인덱스 후보 | 게시판·상태 필터 뒤 정렬 키가 어떤 순서인가? | `(board_id, status, deleted_at, created_at, id)` 후보 |

앞의 스키마 조사에서 이름·타입·관계를 확인한 뒤 아래 쿼리를 실행하세요. 이 열 이름은 확장 fixture 계약에 맞춘 예시입니다. 실제 `SHOW CREATE TABLE`과 다르면 문서의 가정을 DB에 억지로 맞추지 말고, 확인한 이름을 사용해 쿼리를 고칩니다.

```sql
-- 먼저 board-03의 실제 ID를 찾는다. 결과를 아래 쿼리의 board_id에 사용.
SELECT id, slug, name FROM board WHERE slug = 'board-03';

-- API 응답 요구를 관계로 풀어 쓴 쿼리
SELECT p.id AS post_id, p.title, m.nickname AS author_nickname,
       p.created_at
FROM board AS b
JOIN post AS p ON p.board_id = b.id
JOIN member AS m ON m.id = p.author_id
WHERE b.slug = 'board-03'
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC, p.id DESC
LIMIT 20;
```

### WHERE · JOIN · ORDER BY를 고른 이유

- `WHERE b.slug = 'board-03'`: URL에 들어온 slug로 대상 게시판을 찾습니다.
- `JOIN post`: 게시판에 속한 게시글을 연결합니다. 상태와 삭제 조건을 함께 적용합니다.
- `JOIN member`: 응답에 작성자 닉네임이 필요해 게시글 작성 회원을 연결합니다.
- `ORDER BY p.created_at DESC, p.id DESC`: 최신순이며 시각이 같은 행도 안정적으로 순서가 정해집니다. 인덱스 후보의 뒤쪽 열 순서와 연결됩니다.
- `LIMIT 20`: 결과를 20개로 자릅니다. 커서 기반 API라면 마지막 `(created_at, id)`에서 다음 페이지 조건을 추가하고, 더 있는지 확인하려면 보통 `size + 1`행을 조회합니다. 이 1차 실험은 페이지 계약을 단순하게 고정합니다.

## 4. 실제 fixture 쿼리를 실행하고 기준선을 기록

먼저 관계 쿼리를 실행해 응답 후보 열과 정렬 순서를 확인합니다. 인덱스 전후 비교에서는 게시판 ID를 조사 결과로 바꿔 동일한 쿼리를 씁니다. 아래는 그중 실행 계획이 집중되는 게시글 조회입니다. JOIN 응답 쿼리도 별도로 실행해 인덱스 추가 전후 결과를 대조하세요. `EXPLAIN ANALYZE`는 뒤의 SELECT를 실제 실행합니다.

```sql
-- 먼저 실제 행과 정렬 순서를 확인
SELECT id, title, author_id, created_at
FROM post
WHERE board_id = 3
  AND status = 'PUBLISHED'
  AND deleted_at IS NULL
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- 옵티마이저의 추정 계획
EXPLAIN
SELECT id, title, author_id, created_at
FROM post
WHERE board_id = 3
  AND status = 'PUBLISHED'
  AND deleted_at IS NULL
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- SELECT를 실제로 실행하며 iterator의 행·반복·시간을 관찰
EXPLAIN ANALYZE
SELECT id, title, author_id, created_at
FROM post
WHERE board_id = 3
  AND status = 'PUBLISHED'
  AND deleted_at IS NULL
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

결과 행의 `(id, title, author_id, created_at)`와 순서를 파일이나 메모에 저장합니다. 실행 계획의 선택 key, 추정 rows, 정렬 처리 표시와 `EXPLAIN ANALYZE`의 actual rows·loops·actual time도 직접 기록하세요. 실행 전 측정값은 이 문서에 미리 정답으로 쓰지 않습니다.

| 시점 | 선택 key | 추정 rows / 정렬 | actual rows / loops | actual time | 반환한 ID 순서 |
|---|---|---|---|---|---|
| 인덱스 전 | 직접 기록 | 직접 기록 | 직접 기록 | 직접 기록 | 직접 기록 |
| 인덱스 후 | 직접 기록 | 직접 기록 | 직접 기록 | 직접 기록 | 직접 기록 |
| 인덱스 제거 후 | 직접 기록 | 직접 기록 | 직접 기록 | 직접 기록 | 직접 기록 |

<div class="db14 plan-check" aria-label="실행 계획 전후를 나란히 기록하는 비교 체크포인트">
<div class="plan-card"><b>인덱스 전 · 직접 관찰</b><span>선택 key, filesort 여부, 추정 rows와 실제 행·시간을 기록합니다. 실행 전이므로 결과 칸은 비어 있습니다.</span></div>
<div class="plan-card after"><b>인덱스 후 · 같은 쿼리 재실행</b><span>선택 key와 정렬 단계를 다시 기록합니다. 계획이 달라지는지 확인하되, 결과 행과 순서는 같아야 합니다.</span></div>
<div class="same-result">계획 비교 + 결과 동일</div>
</div>

계획 카드에는 실행 전 기대값을 채워 넣지 않습니다. MySQL이 실제로 반환한 `key`, 정렬 단계, 추정·실제 행 수와 시간을 기록하고, 인덱스 후 결과 행 ID 순서가 같은지 확인하세요.

<details><summary>직접 실행한 뒤 펼치기 · 로컬 MySQL 8.4 비교 예시</summary><div class="db14 panel">
<p>기본 50만 좋아요 fixture에서 <code>board_id=3</code>의 게시글 조회를 한 번씩 실행한 관찰입니다. 인덱스 전에는 <code>ix_post_board</code>로 1,000행을 읽고 정렬했으며, 인덱스 후에는 <code>ix_post_board_status_deleted_created</code>를 역방향으로 읽어 20행을 반환했습니다. 첫 5개 게시글 ID는 두 경우 모두 <code>19983, 19963, 19943, 19923, 19903</code>이었습니다.</p>
<p>이때 <code>EXPLAIN ANALYZE</code>의 한 번 측정 시간은 약 12.4ms와 0.44ms였습니다. 실행 환경·캐시에 따라 달라지는 값이므로 여러분의 완료 기준은 <strong>같은 결과 + 직접 관찰한 계획의 변화</strong>입니다.</p>
</div></details>

## 5. 인덱스를 추가하고 같은 결과인지 확인

먼저 앞에서 확인한 `board-03`의 실제 ID와 `SHOW INDEX FROM post` 결과를 확인합니다. 인덱스 이름이 이미 있으면 중복 생성하지 마세요. 후보 인덱스의 앞 열은 동등 조건, 뒤 열은 최신순 정렬 조건을 반영합니다. 보드 ID는 예시에서 3이며 실제 조회 값으로 바꿉니다.

```sql
SHOW INDEX FROM post;

CREATE INDEX ix_post_board_status_deleted_created
    ON post (board_id, status, deleted_at, created_at, id);

ANALYZE TABLE post;
```

`ANALYZE TABLE`은 옵티마이저 통계를 갱신합니다. 쿼리 실행을 분석하는 `EXPLAIN ANALYZE`와 다른 명령입니다. 생성한 정의가 맞는지 확인한 다음, 앞 절의 SELECT·`EXPLAIN`·`EXPLAIN ANALYZE`를 **그대로** 다시 실행하세요.

```sql
SELECT index_name, seq_in_index, column_name
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name = 'post'
ORDER BY index_name, seq_in_index;
```

결과의 행과 순서가 기준선과 완전히 같아야 합니다. 계획이나 시간이 더 좋아졌다고 단정하려면 관측 근거가 있어야 합니다. MySQL이 새 인덱스를 선택하지 않을 수 있고, 작은 fixture에서는 시간 차이가 없거나 측정 순서에 따라 달라질 수 있습니다. `EXPLAIN`은 추정 계획이고 `EXPLAIN ANALYZE`의 시간도 해당 환경에서 SELECT를 실행한 한 번의 관측값입니다.

## 6. 인덱스를 제거해 원래 상태 복원

실험 결과를 기록한 뒤 새 인덱스만 제거합니다. 데이터 자체는 수정하지 않았으므로 제거 뒤 조회 행과 순서도 동일해야 합니다.

```sql
DROP INDEX ix_post_board_status_deleted_created ON post;
ANALYZE TABLE post;

SHOW INDEX FROM post;

SELECT id, title, author_id, created_at
FROM post
WHERE board_id = 3
  AND status = 'PUBLISHED'
  AND deleted_at IS NULL
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

원래 인덱스 집합이 복원됐는지 확인합니다. fixture 전체를 초기화해야 한다면 이 격리 DB에 한해 `tools/db-perf-fixture.sh reset`을 사용할 수 있습니다. 실습을 끝내고 컨테이너를 삭제하려면 `tools/db-perf-fixture.sh down`을 실행합니다.

## 완료 체크

- [ ] DBeaver/CloudBeaver가 `javaexperience_perf`에 연결됐고, `DATABASE()` 결과를 확인했다.
- [ ] 실제 테이블·열·인덱스·FK를 SQL로 조사하고 API 응답 필드에 대응시켰다.
- [ ] 게시판 범위, 상태·삭제 조건, 필요한 JOIN, 전체 정렬 키와 LIMIT의 이유를 설명할 수 있다.
- [ ] 인덱스 전후 계획과 실제 행·시간을 직접 기록했다. 숫자를 추정하거나 복사하지 않았다.
- [ ] 인덱스 전·후·제거 후 목록 쿼리의 결과 튜플과 순서가 동일함을 확인했다.
- [ ] 실험 인덱스를 DROP하고 초기 인덱스 집합을 확인했다.

## 연결

- 앞서 보기: [DB-03 상세 JOIN](db-03-detail-join.md) · [DB-10 격리 성능 fixture](DB-10-performance-fixture.md)
- 관계 쿼리와 실행 계획: [DB-12 JOIN·EXISTS 비교](db-12-join-exists-explain.md)
- 인덱스 원리: [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md)
