/** DB-01: API 응답 필드를 SQL과 practice seed 행으로 하나씩 잇는다. */
const screens = ['scenario', 'fields', 'conditions', 'sql', 'first-row', 'tags'];
const nav = (name, label = '다음 장면') => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions db01-actions">
    ${index ? `<button type="button" class="db-journey-back" data-db01-go="${screens[index - 1]}">← 이전 장면</button>` : '<span></span>'}
    ${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-db01-go="${screens[index + 1]}">${label} →</button>` : '<a class="db-journey-next" href="db-02-select-cursor.html">다음 DB-02 →</a>'}
  </footer>`;
};
const panel = (name, kicker, title, lead, body, nextLabel) => `<article class="db-journey-screen db01-screen" data-db01-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="db01-${name}-title">
  <p class="db-journey-kicker">${kicker}</p><h2 id="db01-${name}-title">${title}</h2>${lead ? `<p class="db-journey-lead">${lead}</p>` : ''}
  ${body}${nav(name, nextLabel)}</article>`;

export function renderDb01FocusedJourney() {
  return `<section class="first-db-journey db01-focused" data-db01-screen="scenario" aria-label="DB-01 응답에서 첫 SQL까지">
    ${panel('scenario', 'DB-01 · 목록의 데이터 찾기', '게시판 목록의 제목·작성자·좋아요 수는 어디서 가져올까요?', '목록 API 계약에서 필요한 테이블을 찾아 첫 SQL 초안을 만듭니다.', `
      <div class="db01-story"><div><small>목록에 필요한 값</small><strong>title · authorNickname · likeCount</strong></div><b>→</b><div><small>이번 작업</small><strong>practice DB의 테이블 찾기</strong></div></div>
      <dl class="db-journey-brief"><div><dt>만들 것</dt><dd><code>GET /api/boards/dev/posts</code> 목록의 첫 SQL 초안</dd></div><div><dt>먼저 확인할 것</dt><dd>practice DB에서 <code>SELECT</code> 실행</dd></div></dl>
      <p class="db01-note">현재 체크아웃에 M1 API 서버 구현은 없어 HTTP 응답을 측정한 것처럼 표시하지 않습니다.</p>
    `, '응답 필드 위치')}

    ${panel('fields', 'DB-01 · 응답 필드의 출처', '작성자 이름은 post가 아니라 member에서 읽습니다.', 'API 응답의 한 필드를 선택해 저장된 테이블 열까지 따라가세요.', `
      <div class="db01-field-choices" role="group" aria-label="응답 필드 고르기"><button type="button" data-db01-field="title" aria-pressed="false">title</button><button type="button" data-db01-field="authorNickname" aria-pressed="true">authorNickname</button><button type="button" data-db01-field="likeCount" aria-pressed="false">likeCount</button><button type="button" data-db01-field="tags" aria-pressed="false">tags[]</button><button type="button" data-db01-field="publishedAt" aria-pressed="false">publishedAt</button></div>
      <div class="db01-field-route"><div><small>응답 필드</small><strong data-db01-field-name>authorNickname</strong></div><b>←</b><div><small>DB 경로</small><strong data-db01-field-path>post.author_id → member.id → member.nickname</strong></div><b>←</b><div><small>practice seed</small><strong data-db01-field-value>글 145 · 밤샘개발자</strong></div></div>
      <p class="db01-note">게시판은 <code>board.slug → board.id → post.board_id</code>, 태그는 <code>post → post_tag → tag</code>를 따라갑니다.</p>
      <a class="db01-reference-link" href="#이번-요청에서-정할-것" data-db01-source="true">필드·테이블 전체 대조 열기 ↗</a>
    `, '조회 조건 정하기')}

    ${panel('conditions', 'DB-01 · WHERE와 ORDER', 'dev 게시판의 공개·발행·미삭제 글을 최신순으로 고르세요.', '커서가 비어 있는 첫 페이지입니다. 다음 페이지의 커서 조건은 DB-02에서 다룹니다.', `
      <div class="db01-gates"><div><small>1 · 게시판</small><strong>board.slug = dev</strong></div><div><small>2 · 발행 상태</small><strong>post.status = PUBLISHED</strong></div><div><small>3 · 공개·미삭제</small><strong>visibility = PUBLIC<br>deleted_at IS NULL</strong></div><div><small>4 · 최신순 20개</small><strong>published_at DESC<br>id DESC · LIMIT 20</strong></div></div>
      <p class="db01-note"><code>GET /api/boards/dev/posts?size=20&amp;cursor=</code>의 SQL 조건입니다. <code>content</code>는 이번 목록 응답에 없습니다.</p>
      <a class="db01-reference-link" href="#조건과-정렬을-먼저-말로-만들기" data-db01-source="true">조건·정렬 원문 열기 ↗</a>
    `, '첫 SQL 만들기')}

    ${panel('sql', 'DB-01 · 메인 SELECT', 'board·post·member를 연결해 첫 20개를 읽으세요.', '태그 이름은 페이지 글을 고른 다음 별도로 조회합니다.', `
      <div class="db01-workbench"><div class="db01-code-surface"><header><strong>practice DB에서 직접 실행</strong><small>M1 첫 페이지 · 읽기 전용</small></header><pre><code data-db01-main-sql>SELECT p.id, p.title, m.nickname AS authorNickname,
       p.like_count AS likeCount,
       p.comment_count AS commentCount,
       p.published_at AS publishedAt
FROM board b
JOIN post p ON p.board_id = b.id
JOIN member m ON m.id = p.author_id
WHERE b.slug = 'dev'
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
  AND p.visibility = 'PUBLIC'
ORDER BY p.published_at DESC, p.id DESC
LIMIT 20;</code></pre><button type="button" data-db01-copy="main">SQL 복사</button><p data-db01-copy-state="main" role="status" aria-live="polite"></p></div>
      <aside class="db01-empty-result"><small>내 DB 실행 결과</small><strong>아직 실행 전</strong><span>CloudBeaver/DBeaver의 practice 연결에서 실행하세요.</span></aside></div>
      <a class="db01-reference-link" href="#sql-초안-만들기" data-db01-source="true">SQL 초안의 선택 이유 열기 ↗</a>
    `, '첫 행 대조하기')}

    ${panel('first-row', 'DB-01 · practice seed 대조', '첫 행이 글 145인지 내 DB의 SELECT 결과로 확인하세요.', '아래는 제공된 seed의 기대 행이며, 오른쪽은 아직 측정하지 않은 내 결과입니다.', `
      <div class="db01-compare"><div><small>practice seed 기준 · 실행 전 기대값</small><strong>id 145 · 스프링 트랜잭션 전파 삽질기</strong><span>밤샘개발자 · 좋아요 20 · 댓글 1</span></div><div><small>내 DB의 실제 첫 행</small><strong>아직 조회 전</strong><span>앞 화면의 SELECT를 DB 클라이언트에서 실행해 대조</span></div></div>
      <p class="db01-note">첫 다섯 ID의 seed 기준 순서는 <code>145 · 144 · 143 · 140 · 138</code>입니다. 태그 <code>java</code>는 다음 별도 쿼리로 확인합니다.</p>
      <a class="db01-reference-link" href="#dbeaver에서-실제-행-확인" data-db01-source="true">DB 행 확인 원문 열기 ↗</a>
    `, '태그를 일괄 조회')}

    ${panel('tags', 'DB-01 · 두 번째 조회', '선택한 글 ID를 모아 태그를 한 번에 읽으세요.', '아래 다섯 ID는 seed 예시입니다. 실제 페이지에 나온 글 ID로 바꿔 실행합니다.', `
      <label class="db01-id-input">현재 페이지의 글 ID <input type="text" value="145,144,143,140,138" data-db01-page-ids spellcheck="false" inputmode="numeric"></label>
      <div class="db01-workbench"><div class="db01-code-surface"><header><strong>post_tag → tag</strong><small>목록 SELECT 다음 별도 일괄 조회</small></header><pre><code data-db01-tags-sql>SELECT pt.post_id, t.name
FROM post_tag pt
JOIN tag t ON t.id = pt.tag_id
WHERE pt.post_id IN (145,144,143,140,138)
ORDER BY pt.post_id, t.name;</code></pre><button type="button" data-db01-copy="tags">SQL 복사</button><p data-db01-copy-state="tags" role="status" aria-live="polite"></p></div>
      <aside class="db01-empty-result"><small>practice seed 기준 · 실행 전</small><strong>글 145 → tag java</strong><span>실제 DB 결과는 직접 확인하세요.</span></aside></div>
      <p class="db01-note">페이지 크기가 20이면 실제 SELECT의 최대 20개 id를 사용합니다. 글마다 따로 태그를 조회한 횟수를 측정했다고 주장하지 않습니다.</p>
    `)}

    <details class="db-journey-reference"><summary>장면별 이미지 시안 6장 보기</summary><p>시안의 seed 값과 실행 전 기대값은 실제 API 응답이 아닙니다.</p>
      ${['01-scenario','02-field-to-table','03-where-order','04-first-sql','05-seed-first-row','06-tags-batch'].map((name) => `<a href="../../docs/design/mockups-2026-10-16-batch21/${name}.png">${name}</a>`).join('')}
    </details>
  </section>`.replace(/[ \t]+\n/g, '\n');
}
