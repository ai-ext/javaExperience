/** DB-06: member 12의 좋아요-북마크 차집합을 SQL 네 방식과 NULL 경계로 나눈다. */
const screens = ['scenario', 'mini', 'correlation', 'not-exists', 'exists', 'not-in', 'null', 'left-join', 'compare', 'java'];
const labels = ['상황', '가상 집합', '한 행의 질문', 'NOT EXISTS', 'EXISTS', 'NOT IN', 'NULL 함정', 'LEFT JOIN', '결과 대조', 'Java 위치'];
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const nav = (name) => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions db06-actions"><button type="button" class="db-journey-back" data-db06-go="${screens[Math.max(0, index - 1)]}"${index ? '' : ' disabled'}>← 이전</button><span>${index + 1} / ${screens.length}</span>${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-db06-go="${screens[index + 1]}">${labels[index + 1]} →</button>` : '<a class="db-journey-next" href="DB-07-same-api-five-query-styles.html">다음 DB-07 →</a>'}</footer>`;
};
const panel = (name, kicker, title, lead, body) => `<article class="db-journey-screen db06-screen" data-db06-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="db06-${name}-title"><p class="db-journey-kicker">${kicker}</p><h2 id="db06-${name}-title">${title}</h2><p class="db-journey-lead">${lead}</p>${body}${nav(name)}</article>`;
const code = (key, title, sql) => `<div class="db06-code"><header><strong>${title}</strong><small>practice DB · 읽기 전용</small></header><pre><code data-db06-sql="${key}">${escapeHtml(sql)}</code></pre><button type="button" data-db06-copy="${key}">SQL 복사</button><p data-db06-copy-state="${key}" role="status" aria-live="polite"></p></div>`;
const record = (key, name) => `<label class="db06-record">내 DB의 실제 post_id 순서 · ${name}<textarea data-db06-record="${key}" rows="3" placeholder="아직 실행 전 · 직접 실행한 뒤 ID를 순서대로 적으세요"></textarea><span>예상 ID는 입력하지 않았습니다. 이 기록은 서버에 저장되지 않습니다.</span></label>`;

export function renderDb06FocusedJourney(markdown) {
  const blocks = [...markdown.matchAll(/<pre class="sql"><code>([\s\S]*?)<\/code><\/pre>/g)].map((match) => match[1].replaceAll('<span class="focus">', '').replaceAll('</span>', ''));
  if (blocks.length !== 4) throw new Error(`DB-06 원문 SQL 블록 4개가 필요합니다: ${blocks.length}`);
  const [notExistsSql, existsSql, notInSql, leftJoinSql] = blocks;
  return `<section class="first-db-journey db06-focused" data-db06-screen="scenario" aria-label="DB-06 좋아요에서 북마크 제외">
    ${panel('scenario', 'DB-06 · 회원 12의 SQL 과제', '“좋아요는 했지만 북마크하지 않은 글만 보고 싶어요.”', '회원 12의 좋아요에서 이미 북마크한 글을 제외해 글 ID를 읽습니다.', `
      <div class="db06-intent"><div><small>만들 것</small><strong>좋아요 − 북마크 읽기 SQL</strong></div><div><small>직접 할 것</small><strong>practice DB에서 SELECT 후 ID 순서 확인</strong></div></div>
      <p class="db06-note"><code>GET /api/me/likes</code>는 관련 계약입니다. 이 SQL 실습 페이지에서 HTTP 요청을 보내지는 않습니다.</p>
    `)}
    ${panel('mini', 'DB-06 · 차집합 먼저 보기', '좋아요한 글에서 북마크한 글을 빼면 무엇이 남을까요?', '101·102·103은 관계를 설명하는 가상 글 ID로 practice seed 결과가 아닙니다.', `
      <div class="db06-sets"><div><small>좋아요한 글</small><strong>101 · 102 · 103</strong></div><b>−</b><div><small>북마크한 글</small><strong>102 · 103</strong></div><b>=</b><div><small>남는 글</small><strong>101</strong></div></div>
      <div class="db06-mini-choice" role="group" aria-label="가상 글 ID 확인"><button type="button" data-db06-mini="101" aria-pressed="true">101</button><button type="button" data-db06-mini="102" aria-pressed="false">102</button><button type="button" data-db06-mini="103" aria-pressed="false">103</button></div><p class="db06-mini-result" data-db06-mini-result>101은 북마크 행이 없으므로 남습니다.</p>
      <p class="db06-note">이 결과를 회원 12의 실제 SQL 결과로 사용하지 않습니다.</p>
    `)}
    ${panel('correlation', 'DB-06 · 바깥 행 한 개', '좋아요 행마다 같은 회원·글의 북마크가 있는지 묻습니다.', '바깥 행의 두 키가 안쪽 bookmark 조회의 조건이 됩니다.', `
      <div class="db06-key-flow"><div><small>현재 post_like 행</small><strong>pl.member_id · pl.post_id</strong></div><b>→</b><div><small>bookmark에서 같은 키 확인</small><strong>b.member_id = pl.member_id</strong><strong>b.post_id = pl.post_id</strong></div></div>
      <div class="db06-choice" role="group" aria-label="북마크 행 존재"><button type="button" data-db06-match="no" aria-pressed="true">매칭 행 없음</button><button type="button" data-db06-match="yes" aria-pressed="false">매칭 행 있음</button></div><p class="db06-decision" data-db06-decision>매칭 행이 없으므로 NOT EXISTS가 TRUE → 결과에 남김</p>
    `)}
    ${panel('not-exists', 'DB-06 · 기준 쿼리', 'NOT EXISTS로 회원 12의 북마크 없는 좋아요를 찾으세요.', '같은 회원·글의 북마크가 없을 때만 바깥 좋아요 행이 남습니다.', `
      <div class="db06-query-grid">${code('not-exists', '원문 NOT EXISTS SQL', notExistsSql)}${record('not-exists', 'NOT EXISTS')}</div>
      <p class="db06-note"><code>pl.member_id</code>와 <code>pl.post_id</code>는 현재 바깥 행의 값입니다. 정렬은 <code>pl.created_at DESC, pl.id DESC</code>입니다.</p>
    `)}
    ${panel('exists', 'DB-06 · 반대 질문', 'EXISTS는 북마크도 한 좋아요를 찾습니다.', '같은 회원·글의 북마크 행이 하나라도 있으면 바깥 좋아요 행을 남깁니다.', `
      <div class="db06-reverse"><div><small>NOT EXISTS</small><strong>북마크가 없으면 유지</strong></div><div><small>EXISTS</small><strong>북마크가 있으면 유지</strong></div></div>
      <div class="db06-query-grid">${code('exists', '원문 EXISTS SQL', existsSql)}${record('exists', 'EXISTS')}</div>
      <p class="db06-note">두 쿼리의 실제 반환 글 ID를 DB에서 확인해 대조하세요. 미실행 상태에서 결과를 확정하지 않습니다.</p>
    `)}
    ${panel('not-in', 'DB-06 · 현재 스키마의 NOT IN', 'NOT IN도 현재 스키마에서는 같은 제외 결과여야 합니다.', '실제 bookmark.post_id와 member_id는 모두 NOT NULL입니다.', `
      <div class="db06-schema"><div><small>bookmark.post_id</small><strong>NOT NULL</strong></div><div><small>bookmark.member_id</small><strong>NOT NULL</strong></div></div>
      <div class="db06-query-grid">${code('not-in', '원문 NOT IN SQL', notInSql)}${record('not-in', 'NOT IN')}</div>
      <p class="db06-note">NOT EXISTS와 같은 회원 12·같은 정렬을 사용합니다. 실제 ID와 순서는 마지막 대조 장면에서 확인하세요.</p>
    `)}
    ${panel('null', 'DB-06 · 별도의 가상 NULL', 'NOT IN 목록에 NULL이 섞이면 TRUE로 확정되지 않습니다.', '이 화면은 NULL 동작만 보여 주는 가상 예시입니다. 실제 bookmark.post_id는 NOT NULL입니다.', `
      <div class="db06-null"><div><small>가상 입력</small><strong>101 NOT IN (102, NULL)</strong></div><b>→</b><div><small>SQL 3값 논리</small><strong>UNKNOWN</strong><span>WHERE는 TRUE만 통과</span></div><b>→</b><div><small>가상 결과</small><strong>101도 제외</strong></div></div>
      <p class="db06-note">같은 키의 북마크 행이 없는지 검사하는 <code>NOT EXISTS</code>라면 이 가상 101은 남습니다. 이 NULL은 practice seed에서 재현되는 행이 아닙니다.</p>
    `)}
    ${panel('left-join', 'DB-06 · LEFT JOIN 방식', 'LEFT JOIN으로 짝이 없는 좋아요만 남길 수도 있습니다.', '회원과 글의 두 조건은 ON에, 북마크 부재 확인은 WHERE에 둡니다.', `
      <div class="db06-anti-flow"><div><small>왼쪽 기준</small><strong>post_like pl · member 12</strong></div><b>LEFT JOIN</b><div><small>ON · 같은 키</small><strong>b.member_id = pl.member_id</strong><strong>b.post_id = pl.post_id</strong></div><b>→</b><div><small>WHERE</small><strong>b.id IS NULL</strong></div></div>
      <div class="db06-query-grid">${code('left-join', '원문 LEFT JOIN anti-join SQL', leftJoinSql)}${record('left-join', 'LEFT JOIN')}</div>
      <p class="db06-note"><code>bookmark(member_id, post_id)</code>는 UNIQUE입니다. 실제 ID 결과는 직접 실행해 확인하세요.</p>
    `)}
    ${panel('compare', 'DB-06 · 같은 데이터 세 방식', 'NOT EXISTS·NOT IN·LEFT JOIN의 글 ID와 순서를 대조하세요.', '앞 장면에서 기록한 실제 DB 결과를 여기에 모읍니다.', `
      <div class="db06-compare"><div><small>NOT EXISTS</small><pre data-db06-display="not-exists">아직 기록 전</pre></div><div><small>NOT IN</small><pre data-db06-display="not-in">아직 기록 전</pre></div><div><small>LEFT JOIN</small><pre data-db06-display="left-join">아직 기록 전</pre></div></div>
      <p class="db06-comparison-status" data-db06-comparison-status role="status" aria-live="polite">세 SQL을 실행한 뒤 각 장면에 결과를 기록하세요.</p>
      <p class="db06-note">동일한 ID 집합과 <code>pl.created_at DESC, pl.id DESC</code> 순서를 확인합니다. 이 화면은 입력한 기록을 비교할 뿐 DB 실행을 대신하지 않습니다.</p>
    `)}
    ${panel('java', 'DB-06 · Java 구현 위치', '같은 제외 조건을 JPA와 MyBatis에 옮길 위치를 찾으세요.', 'SQL의 회원 조건과 결과 순서를 유지하고 생성 SQL을 확인합니다.', `
      <div class="db06-java"><div><small>Service</small><strong>인증된 memberId·페이지·정렬 전달</strong></div><div><small>JPA</small><strong>JPQL NOT EXISTS 또는 native query</strong></div><div><small>MyBatis</small><strong>Mapper XML SELECT + memberId 바인딩</strong></div></div>
      <p class="db06-note">이번 페이지는 SQL 연습이며 새 HTTP API를 만들거나 요청을 보내지 않습니다. 같은 조건의 Java 구현은 <a href="DB-07-same-api-five-query-styles.html">DB-07</a>에서 이어집니다.</p>
    `)}
    <details class="db-journey-reference"><summary>장면별 이미지 시안 10장 보기</summary>${['01-db06-scenario','02-synthetic-difference','03-correlated-row','04-not-exists-plan','05-reverse-exists','06-not-in-schema','07-null-trap','08-left-join-anti','09-three-query-check','10-java-placement'].map((name) => `<a href="../../docs/design/mockups-2026-10-16-batch27/${name}.jpg">${name}</a>`).join('')}</details>
  </section>`;
}
