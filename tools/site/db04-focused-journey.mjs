/** DB-04: seed 한 글의 두 태그 행을 JOIN, DISTINCT, EXISTS 결과와 연결한다. */
const screens = ['scenario', 'seed', 'join-rows', 'join-sql', 'exists', 'distinct', 'api'];
const labels = ['상황', 'seed 관계', 'JOIN 중복', 'JOIN SQL', 'EXISTS SQL', 'DISTINCT 열', 'API 목록'];
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const nav = (name) => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions db04-actions"><button type="button" class="db-journey-back" data-db04-go="${screens[Math.max(0, index - 1)]}"${index ? '' : ' disabled'}>← 이전</button><span>${index + 1} / ${screens.length}</span>${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-db04-go="${screens[index + 1]}">${labels[index + 1]} →</button>` : '<a class="db-journey-next" href="db-05-aggregate-fanout.html">다음 DB-05 →</a>'}</footer>`;
};
const panel = (name, kicker, title, lead, body) => `<article class="db-journey-screen db04-screen" data-db04-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="db04-${name}-title"><p class="db-journey-kicker">${kicker}</p><h2 id="db04-${name}-title">${title}</h2><p class="db-journey-lead">${lead}</p>${body}${nav(name)}</article>`;
const code = (id, title, sql) => `<div class="db04-code"><header><strong>${title}</strong><small>community practice DB · 읽기 전용</small></header><pre><code data-db04-sql="${id}">${escapeHtml(sql)}</code></pre><button type="button" data-db04-copy="${id}">SQL 복사</button><p data-db04-copy-state="${id}" role="status" aria-live="polite"></p></div>`;
const result = (label, expected) => `<aside class="db04-result"><div><small>01-community.sql seed · 실행 전 기대</small><strong>${expected}</strong><span>${label}</span></div><div><small>내 DB의 실제 결과</small><strong>아직 실행 전</strong><span>위 SQL을 실행해 직접 대조하세요.</span></div></aside>`;

export function renderDb04FocusedJourney(markdown) {
  const blocks = [...markdown.matchAll(/<pre class="sql"><code>([\s\S]*?)<\/code><\/pre>/g)].map((match) => match[1]);
  if (blocks.length !== 2) throw new Error(`DB-04 원문 SQL 블록 2개가 필요합니다: ${blocks.length}`);
  const [joinSql, existsSql] = blocks;
  return `<section class="first-db-journey db04-focused" data-db04-screen="scenario" aria-label="DB-04 태그 JOIN DISTINCT EXISTS">
    ${panel('scenario', 'DB-04 · 태그로 글 찾기', '“spring 또는 jpa 태그가 붙은 글을 찾고 싶어요.”', '글 한 건을 결과에서 한 번만 보여 주는 태그 검색을 만듭니다.', `
      <div class="db04-intent"><div><small>만들 것</small><strong>글을 한 번씩 찾는 읽기 SQL</strong></div><div><small>직접 할 것</small><strong>community practice DB에서 SELECT 실행</strong></div></div>
      <p class="db04-note">M1 목록 API는 학습자 구현 대상입니다. 여기서는 HTTP 요청 결과를 꾸미지 않고 데이터 관계와 SQL을 확인합니다.</p>
    `)}
    ${panel('seed', 'DB-04 · 한 글의 두 태그', '글 2번은 태그 연결 행이 두 개입니다.', 'community seed의 실제 관계를 따라가며 같은 post가 어떻게 두 tag에 닿는지 확인하세요.', `
      <div class="db04-seed-map"><div><small>post</small><strong>id 2</strong><span>JPA 연관관계 매핑 정리</span></div><b>→</b><div><small>post_tag</small><button type="button" data-db04-tag="spring" aria-pressed="true">(post_id 2, tag_id 2)</button><button type="button" data-db04-tag="jpa" aria-pressed="false">(post_id 2, tag_id 3)</button></div><b>→</b><div><small>tag</small><strong data-db04-tag-route>id 2 · spring</strong><span>선택한 연결 행</span></div></div>
      <p class="db04-note">위 두 행은 <code>docker/mysql/init/01-community.sql</code>의 seed입니다. 내 DB의 실제 조회 결과는 아직 기록하지 않았습니다.</p>
    `)}
    ${panel('join-rows', 'DB-04 · JOIN의 행 수', 'JOIN하면 같은 글 2번이 두 행으로 보입니다.', '매칭된 태그 연결 행마다 결과 행이 하나씩 생깁니다.', `
      <div class="db04-joined"><div><small>seed 기준 · 실행 전 기대 JOIN 결과</small><strong>post 2 · spring</strong><strong>post 2 · jpa</strong></div><div><small>지금 세어 볼 것</small><strong>연결 행 2개</strong><span>서로 다른 글은 1개</span></div><div><small>내 DB 실행 결과</small><strong>아직 실행 전</strong><span>SQL을 실행한 뒤 비교</span></div></div>
      <p class="db04-note">JOIN의 결과 한 행은 지금 <strong>글-태그 쌍</strong>입니다. 글 목록의 한 행과 같지 않습니다.</p>
    `)}
    ${panel('join-sql', 'DB-04 · JOIN과 DISTINCT', '글 열만 고르고 DISTINCT로 중복을 줄이세요.', '태그 이름을 필터에 쓰되 결과 열에는 넣지 않습니다.', `
      <div class="db04-query-grid">${code('join', 'JOIN + DISTINCT · 원문 SQL', joinSql)}${result('글 열만 선택했을 때 post 2는 한 번', 'post id 2')}</div>
      <p class="db04-note"><code>DISTINCT</code>는 선택한 열 전체를 비교합니다. 태그 이름까지 결과 열에 넣는 경우는 다음 비교 장면에서 확인합니다.</p>
    `)}
    ${panel('exists', 'DB-04 · 존재 검사', 'EXISTS는 조건을 만족하는 글만 한 번 남깁니다.', '바깥의 post 한 행에서 안쪽 post_tag·tag가 하나라도 맞는지 검사합니다.', `
      <div class="db04-exists-flow"><div><small>바깥 글</small><strong>post id 2</strong></div><b>→</b><div><small>연결 기준</small><strong>pt.post_id = p.id</strong><span>tag 이름 spring 또는 jpa</span></div><b>→</b><div><small>바깥 결과</small><strong>post id 2 · 한 번</strong></div></div>
      <div class="db04-query-grid">${code('exists', 'EXISTS · 원문 SQL', existsSql)}${result('안쪽 조건에 맞는 행이 둘이어도 바깥 글은 한 번', 'post id 2')}</div>
      <p class="db04-note">JOIN과 EXISTS의 실제 속도 차이는 여기서 측정하지 않습니다. 먼저 글 ID 집합이 같은지 확인합니다.</p>
    `)}
    ${panel('distinct', 'DB-04 · 선택 열의 경계', '태그 이름을 결과 열에 더하면 DISTINCT도 두 행을 남깁니다.', 'DISTINCT가 비교하는 범위는 선택한 모든 열입니다.', `
      <div class="db04-choice" role="group" aria-label="DISTINCT 결과 열 선택"><button type="button" data-db04-projection="post" aria-pressed="true">글 열만 선택</button><button type="button" data-db04-projection="tag" aria-pressed="false">태그 이름도 선택</button></div>
      <div class="db04-projection"><div><small>선택한 열</small><code data-db04-selected-columns>p.id · p.title · p.published_at</code></div><b>→</b><div><small>seed 기준 DISTINCT 결과</small><strong data-db04-projection-result>post id 2 · 한 행</strong><span data-db04-projection-note>spring·jpa가 있어도 글 열의 조합이 같습니다.</span></div></div>
      <p class="db04-note">이 전환은 개념 시뮬레이션입니다. 내 DB의 실행 결과를 대신하지 않습니다.</p>
    `)}
    ${panel('api', 'DB-04 · 목록 응답 설계', '글 목록을 먼저 고르고 태그를 묶으세요.', '게시글 한 건은 목록에 한 번, 그 글의 태그는 배열로 둡니다.', `
      <div class="db04-api-steps"><div><small>1 · 페이지</small><strong>글 ID를 먼저 선택</strong><span>글 2는 한 번</span></div><b>→</b><div><small>2 · 태그</small><strong>선택한 ID의 태그를 일괄 조회</strong><span>post 2 → spring, jpa</span></div><b>→</b><div><small>3 · DTO</small><strong>글 하나 + tags[]</strong><span>seed 예: [spring, jpa]</span></div></div>
      <div class="db04-cautions"><p>다대다 JOIN 뒤에 바로 <code>LIMIT</code>을 걸면 같은 글이 여러 행을 차지해 페이지 경계가 깨질 수 있습니다.</p><p>글마다 태그를 따로 조회하면 N+1이 생길 수 있습니다. 실제 SQL 로그로 확인해야 합니다.</p></div>
      <p class="db04-note">M1의 실제 목록 API 응답과 SQL 횟수는 아직 관찰하지 않았습니다. <a href="db-01-response-to-query.html">DB-01의 태그 일괄 조회</a>로 돌아가 이어 볼 수 있습니다.</p>
    `)}
    <details class="db-journey-reference"><summary>장면별 이미지 시안 7장 보기</summary>${['01-db04-scenario','02-seed-relationship','03-join-duplicates','04-join-distinct-plan','05-exists-once','06-distinct-columns','07-page-then-tags'].map((name) => `<a href="../../docs/design/mockups-2026-10-16-batch25/${name}.png">${name}</a>`).join('')}</details>
  </section>`;
}
