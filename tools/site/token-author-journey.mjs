/** 1-6: 이미 발급된 DB 토큰의 주인으로 작성자를 정하는 과정. JWT 발급과 혼동하지 않는다. */
const screens = ['scenario', 'interceptor', 'normal', 'spoof', 'unauthorized', 'priority', 'suspended', 'notice', 'database', 'preflight'];
const nav = (name, label = '다음 장면') => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions token-actions">
    ${index ? `<button type="button" class="db-journey-back" data-token-go="${screens[index - 1]}">← 이전 장면</button>` : '<span></span>'}
    ${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-token-go="${screens[index + 1]}">${label} →</button>` : '<a class="db-journey-next" href="1-7-direct-db-dml.html">다음 과제 →</a>'}
  </footer>`;
};
const panel = (name, kicker, title, lead, body, nextLabel) => `<article class="db-journey-screen token-screen" data-token-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="token-${name}-title">
  <p class="db-journey-kicker">${kicker}</p><h2 id="token-${name}-title">${title}</h2>
  ${lead ? `<p class="db-journey-lead">${lead}</p>` : ''}
  ${body}${nav(name, nextLabel)}</article>`;
const select = (ids, labels) => `<div class="token-case-choice" role="group" aria-label="실행할 요청 고르기">${ids.map((id, index) => `<button type="button" data-token-select="${id}" aria-pressed="${index === 0}">${labels[index]}</button>`).join('')}</div>`;
const run = (id, expected, note) => `<div class="token-run-pair" data-token-case="${id}">
  <div class="db-journey-console"><header><strong>${id} · 내 서버에 보내기</strong><small>원문의 실제 요청 패널</small></header><div data-token-server="${id}"></div><div data-token-request="${id}"></div></div>
  <aside class="db-journey-expect"><p>구현 후 기대값 · 실행 결과 아님</p><strong>${expected}</strong><span>${note}</span><hr><p>내 서버 결과</p><strong class="db-journey-actual" data-token-actual="${id}">아직 실행 전</strong></aside>
</div>`;
const sql = (id, query, value, note) => `<div class="token-sql-row"><div class="db-journey-query"><header><strong>${id} · 별도 DB 클라이언트에서 실행</strong><small>community DB</small></header><pre><code data-token-sql="${id}">${query}</code></pre><button type="button" data-token-copy="${id}"${id === 'D1' ? ' disabled' : ''}>SQL 복사</button><p data-token-copy-state="${id}" role="status" aria-live="polite"></p></div><aside class="db-journey-expect"><p>구현 후 기대값 · 실제 DB 조회 전</p><strong>${value}</strong><span>${note}</span></aside></div>`;

export function renderTokenAuthorJourney() {
  return `<section class="first-db-journey token-journey" data-token-screen="scenario" aria-label="1-6 토큰의 주인으로 작성자 정하기">
    ${panel('scenario', '1-6 · 글의 작성자', '제가 쓴 글인데 작성자가 김자바로 나와요.', '지금은 누가 보내도 회원 2가 작성자가 됩니다. 이미 발급된 토큰으로 실제 작성자를 찾아 주세요.', `
      <div class="token-story"><div><small>글을 보내는 사람</small><strong>이스프링 · 회원 3</strong></div><b aria-hidden="true">≠</b><div><small>현재 저장되는 작성자</small><strong>김자바 · 회원 2</strong></div></div>
      <dl class="db-journey-brief"><div><dt>만들 것</dt><dd><code>Authorization</code> 헤더의 토큰 주인을 작성자로 연결</dd></div><div><dt>보낼 것</dt><dd><code>POST /api/posts</code> · <code>Bearer tok-lee</code></dd></div></dl>
    `, '토큰 확인 위치')}

    ${panel('interceptor', '1-6 · 구현 위치', '토큰 확인은 Controller보다 먼저 일어납니다.', '토큰 발급이나 로그인은 이번에 만들지 않습니다. 기존 <code>api_token</code> 행의 주인과 상태를 확인합니다.', `
      <div class="token-flow"><div><small>요청 헤더</small><strong>Bearer tok-lee</strong></div><b>→</b><div><small>AuthInterceptor</small><strong>형식·토큰 확인</strong></div><b>→</b><div><small>api_token</small><strong>회원 3 · 이스프링</strong></div><b>→</b><div><small>Controller</small><strong>인증된 회원 ID</strong></div></div>
      <div class="token-seed"><span>초기 SQL 데이터 · 실제 실행 결과 아님</span><code>id 3</code><code>tok-lee</code><code>member_id 3</code><code>expires_at 2099-12-31</code><code>revoked_at NULL</code></div>
      <p class="token-note">회원 상태와 만료·폐기도 확인합니다. 토큰 원문은 응답이나 로그에 싣지 않습니다.</p>
      <a class="token-reference-link" href="#구현-가이드" data-task-open="true">Interceptor·Repository 구현 가이드 열기 ↗</a>
    `, '정상 요청 보내기')}

    ${panel('normal', '1-6 · 정상 요청 T1', '이스프링 토큰으로 쓴 글은 이스프링의 글입니다.', '요청을 보낸 뒤 응답의 <code>author.id</code>와 <code>author.nickname</code>을 확인합니다.', `
      ${run('T1', '201 Created', 'author.id = 3 · author.nickname = 이스프링')}
      <p class="token-note">응답의 글 id로 DB 작성자까지 확인하는 SQL은 뒤의 DB 장면에 있습니다.</p>
    `, '본문 위조 확인')}

    ${panel('spoof', '1-6 · 작성자 출처 T2', '본문의 authorId를 바꿔도 남의 글이 되면 안 됩니다.', '클라이언트가 보내는 작성자 번호보다 인증된 회원 정보를 우선합니다.', `
      <div class="token-two-sources"><div><small>신뢰하는 출처 · 요청 헤더</small><strong>tok-kimjava → 회원 2</strong></div><div><small>신뢰하지 않는 값 · 요청 본문</small><strong>authorId: 1 → 무시</strong></div><div><small>저장할 작성자</small><strong>회원 2 · 김자바</strong></div></div>
      ${run('T2', '201 Created', '응답 author.id = 2 · 본문의 authorId는 무시')}
    `, '401 확인')}

    ${panel('unauthorized', '1-6 · 인증 실패 T3–T7', '누구인지 모르면 글을 저장하지 않습니다.', '한 번에 하나씩 요청을 고르세요. 토큰 없음·형식 오류·미등록·만료·폐기는 모두 인증 실패입니다.', `
      ${select(['T3', 'T4', 'T5', 'T6', 'T7'], ['T3 · 헤더 없음', 'T4 · Bearer 없음', 'T5 · 없는 토큰', 'T6 · 만료', 'T7 · 폐기'])}
      ${run('T3', '401 Unauthorized', 'Content-Type: application/problem+json · WWW-Authenticate: Bearer')}
      ${run('T4', '401 Unauthorized', 'Bearer 형식이 아니라 거절')}
      ${run('T5', '401 Unauthorized', 'DB에서 토큰을 찾지 못함')}
      ${run('T6', '401 Unauthorized', '현재 시각이 expires_at 이상이면 만료')}
      ${run('T7', '401 Unauthorized', 'revoked_at이 있으면 폐기된 토큰')}
      <p class="token-note">401은 회원을 신뢰할 수 없는 상태입니다. 응답에 토큰 원문이나 내부 예외 이름을 넣지 않습니다.</p>
    `, '처리 순서 확인')}

    ${panel('priority', '1-6 · 인증의 순서 T9', '토큰이 없으면 깨진 JSON보다 먼저 401입니다.', 'Interceptor에서 인증을 거절하면 Controller의 본문 변환까지 가지 않습니다.', `
      <div class="token-order"><div><small>1 · 먼저</small><strong>AuthInterceptor</strong><span>Authorization 없음 → 여기서 종료</span></div><b>→</b><div class="token-order-muted"><small>2 · 도달하지 않음</small><strong>JSON 역직렬화</strong><span>본문이 깨졌는지는 아직 읽지 않음</span></div></div>
      ${run('T9', '401 Unauthorized', '깨진 JSON이 있어도 이번 요청은 400이 아닙니다.')}
    `, '정지 회원 확인')}

    ${panel('suspended', '1-6 · 회원 상태 T8', '토큰은 유효하지만 회원이 정지됐다면 403.', '토큰 주인은 식별됐습니다. 회원 상태가 ACTIVE가 아니어서 작성은 허용되지 않습니다.', `
      <div class="token-flow token-flow-three"><div><small>tok-choi</small><strong>존재·유효</strong></div><b>→</b><div><small>회원 5 · 최정지</small><strong>SUSPENDED</strong></div><b>→</b><div><small>결과</small><strong>403 Forbidden</strong></div></div>
      ${run('T8', '403 Forbidden', 'application/problem+json · 이용이 정지된 계정')}
      <p class="token-note"><b>401</b>은 누구인지 모르고, <b>403</b>은 누구인지 알지만 해당 행동을 허용하지 않습니다.</p>
    `, '게시판 권한 확인')}

    ${panel('notice', '1-6 · 게시판 권한 T10·T11', '같은 공지 게시판도 토큰 주인에 따라 다릅니다.', '<code>notice.write_role = ADMIN</code>입니다. 인증된 회원의 역할로 쓰기 권한을 판단합니다.', `
      ${select(['T10', 'T11'], ['T10 · 운영자 토큰', 'T11 · 일반 회원 토큰'])}
      <div class="token-flow token-flow-three"><div><small>토큰 주인</small><strong data-token-role-member>회원 1 · ADMIN</strong></div><b>→</b><div><small>notice 게시판</small><strong>write_role ADMIN</strong></div><b>→</b><div><small>쓰기 판단</small><strong data-token-role-result>허용</strong></div></div>
      ${run('T10', '201 Created', '운영자 토큰 · 응답 author.id = 1')}
      ${run('T11', '403 Forbidden', '일반 회원 토큰 · 글 저장 없음')}
    `, 'DB에서 확인')}

    ${panel('database', '1-6 · DB 증거', '작성자와 거절된 글을 DB에서 확인하세요.', '서버의 HTTP 상태만으로 실제 행을 증명할 수 없습니다. 별도 DB 클라이언트에서 SQL을 실행합니다.', `
      <label class="token-post-id-input">T1 응답에서 받은 글 id <input type="number" min="1" inputmode="numeric" data-token-post-id placeholder="T1 요청을 보내면 자동으로 채워집니다"></label>
      ${sql('D1', 'SELECT author_id FROM post WHERE id = {id};', '3', 'T1의 실제 201 응답에서 받은 id로 조회')}
      ${sql('D2', "SELECT COUNT(*) FROM post WHERE title = '[채점] 토큰-공지-실패';", '0', 'T11의 거절된 글은 저장되지 않아야 함')}
      <p class="token-note">DBeaver/CloudBeaver는 앱 요청의 일부가 아니라 별도의 관찰 도구입니다.</p>
    `, '브라우저 사전 요청')}

    ${panel('preflight', '1-6 · 브라우저 사전 요청', 'OPTIONS는 글 작성 요청이 아닙니다.', '브라우저는 Authorization 헤더를 보내기 전 CORS 사전 요청을 할 수 있습니다. 이 요청을 토큰 검사에서 통과시켜야 합니다.', `
      <div class="token-case-choice" role="group" aria-label="요청 순서"><button type="button" data-token-preflight="options" aria-pressed="true">1 · OPTIONS 사전 요청</button><button type="button" data-token-preflight="post" aria-pressed="false">2 · 실제 POST</button></div>
      <div class="token-preflight-state" data-token-preflight-panel="options"><div><small>브라우저</small><strong>OPTIONS /api/posts</strong><span>Authorization 토큰 없음</span></div><b>→</b><div><small>AuthInterceptor</small><strong>CorsUtils.isPreFlightRequest</strong><span>Bearer 검사를 건너뛰고 통과</span></div></div>
      <div class="token-preflight-state" data-token-preflight-panel="post" hidden><div><small>브라우저</small><strong>POST /api/posts</strong><span>Authorization: Bearer tok-lee</span></div><b>→</b><div><small>AuthInterceptor</small><strong>토큰 검사 실행</strong><span>유효한 회원만 Controller로 전달</span></div></div>
      <p class="token-note">OPTIONS를 401로 막으면 브라우저가 실제 POST를 보내지 못할 수 있습니다. 위 흐름은 설명용이며 이 화면에서 OPTIONS를 전송하지 않습니다.</p>
      <a class="token-reference-link" href="#만들-것" data-task-open="true">CORS·Clock·로그 비밀값 규칙 열기 ↗</a>
    `)}

    <details class="db-journey-reference"><summary>장면별 이미지 시안 10장 보기</summary><p>시안의 값은 초기 데이터 또는 실행 전 기대값입니다. 실제 서버·DB 결과는 직접 확인합니다.</p>
      ${['01-token-author-scenario', '02-interceptor-flow', '03-normal-author', '04-untrusted-author-id', '05-unauthorized', '06-auth-before-json', '07-suspended', '08-notice-role', '09-db-proof', '10-preflight'].map((name) => `<a href="../../docs/design/mockups-2026-10-15-batch17/${name}.jpg">${name}</a>`).join('')}
    </details>
  </section>`.replace(/[ \t]+\n/g, '\n');
}
