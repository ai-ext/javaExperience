/** DB-03: 필수 JOIN, 선택 LEFT JOIN, 접근 정책을 다른 장면으로 다룬다. */
const screens = ['scenario', 'required', 'optional', 'sql', 'policy'];
const labels = ['상황', '필수 JOIN', '선택 LEFT JOIN', 'DB SQL', '접근 정책'];
const sql = [
  'SELECT p.id, p.title, p.content,',
  '       b.slug AS boardSlug, m.id AS authorId,',
  '       m.nickname AS authorNickname,',
  '       (pl.id IS NOT NULL) AS likedByMe,',
  '       (bm.id IS NOT NULL) AS bookmarkedByMe',
  'FROM post p',
  'JOIN board b ON b.id = p.board_id',
  'JOIN member m ON m.id = p.author_id',
  'LEFT JOIN post_like pl',
  '  ON pl.post_id = p.id AND pl.member_id = 7',
  'LEFT JOIN bookmark bm',
  '  ON bm.post_id = p.id AND bm.member_id = 7',
  'WHERE p.id = 145;',
].join('\n');
const nav = (name) => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions db03-actions"><button type="button" class="db-journey-back" data-db03-go="${screens[Math.max(0, index - 1)]}"${index ? '' : ' disabled'}>← 이전</button><span>${index + 1} / ${screens.length}</span>${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-db03-go="${screens[index + 1]}">${labels[index + 1]} →</button>` : '<a class="db-journey-next" href="db-04-tag-filter-and-exists.html">다음 DB-04 →</a>'}</footer>`;
};
const panel = (name, kicker, title, lead, body) => `<article class="db-journey-screen db03-screen" data-db03-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="db03-${name}-title"><p class="db-journey-kicker">${kicker}</p><h2 id="db03-${name}-title">${title}</h2><p class="db-journey-lead">${lead}</p>${body}${nav(name)}</article>`;

export function renderDb03FocusedJourney() {
  return `<section class="first-db-journey db03-focused" data-db03-screen="scenario" aria-label="DB-03 상세 JOIN과 접근 정책">
    ${panel('scenario', 'DB-03 · 상세 정보 조립', '글 하나의 상세 정보는 어디서 모을까요?', '글의 내용과 게시판·작성자, 그리고 내 좋아요·북마크 여부를 하나의 상세 정보로 조립합니다.', `
      <div class="db03-fields"><span>title · content</span><span>boardSlug</span><span>authorNickname</span><span>likedByMe</span><span>bookmarkedByMe</span></div>
      <div class="db03-intent"><div><small>만들 것</small><strong>상세 데이터를 조립할 읽기 SQL</strong></div><div><small>직접 할 것</small><strong>practice DB에서 SELECT 실행</strong></div></div>
      <p class="db03-note">M1 <code>GET /api/posts/145</code>는 현재 체크아웃에 구현되지 않았습니다. 이 화면은 API 응답을 측정한 것이 아닙니다.</p>
    `)}
    ${panel('required', 'DB-03 · 필수 관계', '글·게시판·작성자는 반드시 연결합니다.', 'post의 두 외래 키에서 각각 한 갈래씩 따라갑니다.', `
      <div class="db03-required"><div><small>글 · post 145</small><strong>post.board_id</strong><strong>post.author_id</strong></div><div><small>JOIN board</small><strong>board.id → board.slug</strong><span>seed 기준 dev</span></div><div><small>JOIN member</small><strong>member.id → member.nickname</strong><span>seed 기준 밤샘개발자</span></div></div>
      <p class="db03-note"><code>post.board_id</code>와 <code>post.author_id</code>는 스키마에서 NOT NULL입니다. 게시판과 작성자가 응답을 성립시키는 필수 관계입니다.</p>
      <a class="db03-source" href="#db03-original" data-db03-source>응답 필드·테이블 대조 원문 열기 ↗</a>
    `)}
    ${panel('optional', 'DB-03 · 선택 관계', '북마크가 없어도 글은 남아야 합니다.', 'viewer 7의 좋아요와 북마크는 있을 수도, 없을 수도 있습니다.', `
      <div class="db03-optional"><div><small>LEFT JOIN post_like</small><strong>viewer 7 · 행 있음</strong><span>likedByMe = true</span></div><div><small>기준 글</small><strong>post 145</strong><span>선택 행이 없어도 유지</span></div><div><small>LEFT JOIN bookmark</small><strong>viewer 7 · 행 없음</strong><span>bookmarkedByMe = false</span></div></div>
      <div class="db03-rule"><strong>viewer 조건은 ON에 둡니다.</strong><span><code>WHERE bm.member_id = 7</code>로 옮기면 매칭되지 않은 NULL 행이 제거되어 글 자체가 사라집니다.</span></div>
      <a class="db03-source" href="#db03-original" data-db03-source>JOIN과 LEFT JOIN 설명 열기 ↗</a>
    `)}
    ${panel('sql', 'DB-03 · 직접 SQL 확인', '필수 두 행과 선택 두 관계를 붙여 읽으세요.', '145와 viewer 7은 practice seed의 연습값입니다. 내 DB에서 직접 실행해 확인합니다.', `
      <div class="db03-query-grid"><div class="db03-code"><header><strong>practice DB · 읽기 전용</strong><small>실제 실행 전</small></header><pre><code data-db03-sql>${sql}</code></pre><button type="button" data-db03-copy>SQL 복사</button><p data-db03-copy-state role="status" aria-live="polite"></p></div><aside class="db03-results"><div><small>practice seed 기준 · 실행 전 기대 행</small><strong>id 145 · dev · 밤샘개발자</strong><span>likedByMe 1 · bookmarkedByMe 0</span></div><div><small>내 DB의 실제 결과</small><strong>아직 실행 전</strong><span>SQL을 실행해 한 행인지 대조하세요.</span></div></aside></div>
      <p class="db03-note">앱 구현에서는 <code>145</code>와 <code>7</code>을 문자열에 이어 붙이지 말고 바인딩 파라미터로 전달합니다.</p>
    `)}
    ${panel('policy', 'DB-03 · SQL 뒤의 판단', '조회한 데이터의 접근 권한은 Java에서 판단합니다.', 'JOIN 쿼리는 응답 재료를 모으지만, 이 글을 볼 권한까지 판정하지 않습니다.', `
      <div class="db03-policy"><div><small>요청 계약</small><strong>GET /api/posts/145</strong></div><b>→</b><div><small>DB 읽기</small><strong>post와 관련 행</strong></div><b>→</b><div><small>Java</small><strong>PostAccessPolicy</strong></div><b>→</b><div><small>응답</small><strong>허용 DTO / 거부</strong></div></div>
      <p class="db03-note">허용되지 않은 글의 내용은 HTTP 응답에 섞지 않습니다. 이 흐름은 설명용이며 현재 M1 API 실행 결과가 아닙니다.</p>
      <a class="db03-source" href="#권한-판정은-쿼리-결과-뒤에-이어진다" data-db03-source>접근 정책 원문 열기 ↗</a>
    `)}
    <details class="db-journey-reference"><summary>장면별 이미지 시안 5장 보기</summary>${['01-db03-scenario','02-required-joins','03-optional-left-joins','04-join-sql-check','05-access-policy'].map((name) => `<a href="../../docs/design/mockups-2026-10-16-batch24/${name}.png">${name}</a>`).join('')}</details>
  </section>`;
}
