/** L15: JWT 뒤 선택 실습. 실제 쿠키·CSRF 값은 페이지에 입력하거나 저장하지 않는다. */
const screens = ['scenario', 'prepare', 'csrf', 'csrf-failure', 'login', 'rotation', 'me', 'other-cookie', 'logout', 'comparison', 'idle', 'cookie-security'];
const nav = (name, label = '다음 장면') => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions session-actions">
    ${index ? `<button type="button" class="db-journey-back" data-session-go="${screens[index - 1]}">← 이전 장면</button>` : '<span></span>'}
    ${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-session-go="${screens[index + 1]}">${label} →</button>` : '<a class="db-journey-next" href="../../ch10-project/10-4-login-jwt.html">JWT 실습과 다시 비교 →</a>'}
  </footer>`;
};
const panel = (name, kicker, title, lead, body, nextLabel) => `<article class="db-journey-screen session-screen" data-session-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="session-${name}-title">
  <p class="db-journey-kicker">${kicker}</p><h2 id="session-${name}-title">${title}</h2>${lead ? `<p class="db-journey-lead">${lead}</p>` : ''}
  ${body}${nav(name, nextLabel)}</article>`;
const command = (name, value, note) => `<div class="session-command"><header><strong>${name}</strong><small>${note}</small></header><pre><code data-session-command="${name}">${value}</code></pre><button type="button" data-session-copy="${name}">명령 복사</button><p data-session-copy-state="${name}" role="status" aria-live="polite"></p></div>`;
const result = (label, expected, note) => `<aside class="session-expected"><small>${label} · 실행 전 기대값</small><strong>${expected}</strong><p>${note}</p><span>실제 응답은 터미널과 로컬 쿠키 jar에서 직접 확인하세요.</span></aside>`;

export function renderSessionLabJourney() {
  return `<section class="first-db-journey session-journey" data-session-screen="scenario" aria-label="L15 세션 로그인 학습">
    ${panel('scenario', 'L15 · JWT 다음 선택 실습', '다음 요청에 비밀번호를 안 보냈는데 어떻게 같은 사람인 줄 알까요?', '서버가 기억하는 로그인 상태를 쿠키로 이어 보는 실습입니다.', `
      <div class="session-story"><div><small>첫 요청</small><strong>이메일·비밀번호로 로그인</strong></div><b>→</b><div><small>다음 요청</small><strong>비밀번호 없이 내 정보</strong></div></div>
      <dl class="db-journey-brief"><div><dt>만들 것</dt><dd>세션 로그인과 <code>/api/v1/session/me</code> 연결</dd></div><div><dt>먼저 보낼 것</dt><dd><code>GET /api/v1/session/csrf</code></dd></div></dl>
      <p class="session-prerequisite">10-4 JWT 완료 후, 별도 project DB 작업 브랜치에서 진행합니다.</p>
    `, '같은 회원 준비')}

    ${panel('prepare', 'L15 · 시작 전에 준비', '같은 회원을 준비하고 실제 id를 기록하세요.', '가입에서 받은 회원 id를 이후 세션·JWT 두 방식에 계속 사용합니다.', `
      <label class="session-base-input">실습 서버 주소 <input type="url" value="http://localhost:8080" data-session-base spellcheck="false"></label>
      <div class="session-prep-grid"><div><small>1 · 회원 가입</small><strong>POST /api/v1/users</strong><span>session-lab@example.com 계정을 만들고 응답 id를 기록</span><a href="../../ch10-project/10-3-signup.html">10-3 가입 과제 열기 ↗</a></div><div><small>2 · 같은 회원 JWT 발급</small><strong>POST /api/v1/auth/login</strong><span>세션 로그아웃 뒤 비교할 JWT를 미리 발급</span><a href="../../ch10-project/10-4-login-jwt.html">10-4 JWT 과제 열기 ↗</a></div></div>
      <label class="session-id-entry">가입 응답의 실제 회원 id <input type="number" min="1" inputmode="numeric" data-session-member-id placeholder="응답을 보고 id를 입력하세요"></label>
      <p class="session-note">아래에서 <b data-session-id-label>N</b>은 이 응답 id입니다. curl은 저장소 밖의 임시 폴더에서 실행하고, JWT·세션 ID·CSRF 원문은 이 페이지에 입력하지 마세요.</p>
    `, '익명 세션 만들기')}

    ${panel('csrf', 'L15 · 첫 세션 요청', '첫 요청에서 익명 세션과 CSRF 토큰을 만듭니다.', '<code>getSession(true)</code>가 새 세션을 만들지만 아직 로그인한 회원 id는 없습니다.', `
      <div class="session-flow"><div><small>브라우저/터미널</small><strong>GET /api/v1/session/csrf</strong></div><b>→</b><div><small>서버 HttpSession</small><strong>csrfToken 보관 · userId 없음</strong></div><b>→</b><div><small>클라이언트</small><strong>JSESSIONID 쿠키 jar</strong></div></div>
      <div class="session-pair">${command('csrf', 'curl -i -c session-before.jar {{BASE}}/api/v1/session/csrf', '터미널에서 실행')}${result('관찰 1', 'Set-Cookie + csrfToken', '쿠키에는 세션 id만, CSRF 값은 응답과 서버 세션에 있습니다.')}</div>
      <p class="session-note">실제 쿠키·토큰 값을 URL, 로그, 이 학습 페이지에 복사하지 않습니다.</p>
    `, 'CSRF 실패 확인')}

    ${panel('login', 'L15 · 세션 로그인', '같은 쿠키와 CSRF 헤더로 로그인 요청을 보내세요.', 'CSRF 검증이 먼저 통과하면 이메일·비밀번호로 회원을 찾습니다.', `
      <div class="session-flow"><div><small>기존 쿠키 jar</small><strong>session-before.jar</strong></div><b>+</b><div><small>요청 헤더</small><strong>X-CSRF-Token: TOKEN</strong></div><b>→</b><div><small>회원 확인</small><strong>userId = <span data-session-id-label>N</span></strong></div></div>
      <div class="session-pair">${command('login', "curl -i -b session-before.jar -c session-after.jar -H 'Content-Type: application/json' -H 'X-CSRF-Token: TOKEN' -d '{\"email\":\"session-lab@example.com\",\"password\":\"password1234\"}' {{BASE}}/api/v1/session/login", 'TOKEN은 /csrf 응답 값으로 터미널에서 대체')}${result('관찰 2', 'HTTP 200 · 회원 id <span data-session-id-label>N</span>', '응답에 비밀번호나 해시가 없어야 합니다.')}</div>
      <p class="session-note">TOKEN 자리에는 앞 응답 값을 터미널에서만 넣으세요. 이 페이지는 비밀값을 받지 않습니다.</p>
    `, '세션 ID 회전')}

    ${panel('rotation', 'L15 · 로그인 성공 뒤', '로그인 성공 때 세션 ID를 바꿔 주세요.', '<code>request.changeSessionId()</code>가 로그인 전 식별자를 버리고 새 식별자를 발급합니다.', `
      <div class="session-rotation"><div><small>로그인 전 · 익명</small><strong>JSESSIONID = A</strong><span>서버: csrfToken · userId 없음</span></div><b>→</b><div><small>로그인 후 · 인증됨</small><strong>JSESSIONID = B</strong><span>서버: csrfToken 유지 · userId = <span data-session-id-label>N</span></span></div></div>
      <p class="session-note">A와 B는 실제 값이 아니라 서로 달라야 하는 두 식별자의 기호입니다. 로컬 <code>session-before.jar</code>와 <code>session-after.jar</code>의 값을 직접 대조하고, 원문 값을 화면에 붙여 넣지 마세요.</p>
    `, '내 정보 조회')}

    ${panel('me', 'L15 · 같은 쿠키로 내 정보', '새 쿠키로 서버 세션의 회원 번호를 찾으세요.', '<code>getSession(false)</code>로 기존 세션만 읽고, 그 안의 userId로 현재 users 행을 다시 조회합니다.', `
      <div class="session-flow"><div><small>쿠키 jar</small><strong>session-after.jar</strong></div><b>→</b><div><small>HttpSession</small><strong>userId = <span data-session-id-label>N</span></strong></div><b>→</b><div><small>users DB</small><strong>id = <span data-session-id-label>N</span> 조회</strong></div></div>
      <div class="session-pair">${command('me', 'curl -i -b session-after.jar {{BASE}}/api/v1/session/me', '터미널에서 실행')}${result('관찰 3', 'HTTP 200 · 회원 id <span data-session-id-label>N</span>', '이메일·닉네임은 DB에서 읽고 비밀번호 원문·해시는 응답에서 뺍니다.')}</div>
      <p class="session-note">JSESSIONID는 회원 번호가 아닙니다. 세션 속성의 id로 회원을 찾습니다.</p>
    `, '다른 쿠키 비교')}

    ${panel('other-cookie', 'L15 · 쿠키가 다를 때', '다른 쿠키로는 앞의 로그인 상태를 찾을 수 없습니다.', '쿠키가 없거나 다른 jar라면 <code>getSession(false)</code>로 로그인한 세션을 얻지 못합니다.', `
      <div class="session-rotation"><div><small>앞 화면</small><strong>기존 jar B → 회원 <span data-session-id-label>N</span></strong></div><b>≠</b><div><small>이번 요청</small><strong>쿠키 없음 → 회원 없음</strong></div></div>
      <div class="session-pair">${command('me-no-cookie', 'curl -i {{BASE}}/api/v1/session/me', '새 쿠키 없이 터미널에서 실행')}${result('관찰 4', 'HTTP 401', '새 세션을 만들지 않습니다. 기존 jar B의 로그인 상태는 유지됩니다.')}</div>
    `, '로그아웃')}

    ${panel('csrf-failure', 'L15 · CSRF 실패', 'CSRF 헤더가 없으면 비밀번호 확인 전에 403입니다.', '로그인 요청에 쿠키가 있어도 별도 X-CSRF-Token이 없으면 상태를 바꾸지 않습니다.', `
      <div class="session-flow"><div><small>서버 세션</small><strong>csrfToken 있음</strong></div><b>≠</b><div><small>요청 헤더</small><strong>X-CSRF-Token 없음</strong></div><b>→</b><div><small>처리</small><strong>비밀번호 확인 전 중단</strong></div></div>
      <div class="session-pair">${command('login-no-csrf', "curl -i -b session-before.jar -c session-failed.jar -H 'Content-Type: application/json' -d '{\"email\":\"session-lab@example.com\",\"password\":\"password1234\"}' {{BASE}}/api/v1/session/login", '실패를 재현하는 요청')}${result('예외 관찰', 'HTTP 403', '익명 세션에 userId가 생기지 않고 세션 id도 로그인용으로 회전하지 않아야 합니다.')}</div>
    `, '정상 로그인 요청')}

    ${panel('logout', 'L15 · 세션 로그아웃', '로그아웃은 서버 세션을 무효화합니다.', '로그인한 쿠키와 올바른 CSRF 헤더를 보내야 <code>session.invalidate()</code>까지 갑니다.', `
      <div class="session-flow"><div><small>쿠키+CSRF</small><strong>session-after.jar · TOKEN</strong></div><b>→</b><div><small>서버</small><strong>session.invalidate()</strong></div><b>→</b><div><small>응답</small><strong>204 · 본문 없음</strong></div></div>
      <div class="session-pair">${command('logout', "curl -i -X POST -b session-after.jar -H 'X-CSRF-Token: TOKEN' {{BASE}}/api/v1/session/logout", 'TOKEN은 /csrf 응답 값으로 터미널에서 대체')}${result('관찰 5', 'HTTP 204 No Content', '같은 옛 쿠키로 /me를 다시 요청하면 401이어야 합니다.')}</div>
      <p class="session-note">CSRF가 없거나 틀리면 403이고 세션을 유지합니다. 오래된 쿠키를 다시 보내도 회원으로 인정하지 않습니다.</p>
    `, 'JWT와 비교')}

    ${panel('idle', 'L15 · 유휴 만료', '마지막 요청 뒤 오래 쉬면 세션이 만료됩니다.', '실습용 짧은 timeout을 설정하고 마지막 접근 뒤의 유휴 시간을 관찰합니다.', `
      <div class="session-timeline"><span>마지막 접근</span><b></b><span>설정한 유휴 timeout</span><b></b><strong>다음 /me → 401</strong></div>
      <div class="session-pair">${command('me-after-idle', 'curl -i -b session-after.jar {{BASE}}/api/v1/session/me', '재로그인 뒤 timeout만큼 유휴 상태로 둔 다음')}${result('관찰 6', 'HTTP 401', 'Servlet 컨테이너가 만료한 세션의 userId를 복구하지 못합니다.')}</div>
      <p class="session-note">앞에서 로그아웃했다면 /csrf와 /login을 다시 실행해 새 로그인 jar를 만든 뒤 기다리세요. 실측하지 않은 초 수를 결과로 쓰거나 앱 코드에 별도 시각 덧셈 로직을 만들지 않습니다.</p>
    `, '쿠키·CSRF 원리')}

    ${panel('comparison', 'L15 · 두 방식의 수명', '세션 로그아웃이 이미 발급한 JWT를 없애지는 않습니다.', '같은 회원의 쿠키와 JWT를 각각 보내 두 인증 상태를 비교합니다.', `
      <div class="session-comparison"><div><small>무효화된 세션 쿠키</small><strong>GET /api/v1/session/me</strong><span>기대 401 · 서버 세션이 무효화됨</span></div><div><small>10-4에서 미리 받은 JWT</small><strong>GET /api/v1/users/me</strong><span>서명 유효·만료 전이라면 기대 200</span></div></div>
      <div class="session-pair">${command('session-after-logout', 'curl -i -b session-after.jar {{BASE}}/api/v1/session/me', '세션 결과')}${command('jwt-after-session-logout', "curl -i -H 'Authorization: Bearer JWT_FROM_10_4' {{BASE}}/api/v1/users/me", 'JWT_FROM_10_4는 앞서 발급한 값으로 터미널에서 대체')}</div>
      <p class="session-note">두 명령의 실제 결과는 각각 터미널에서 확인하세요. JWT가 이미 만료됐다면 200을 기대하지 않습니다.</p>
    `, '유휴 만료')}

    ${panel('cookie-security', 'L15 · 쿠키와 CSRF', '쿠키가 자동으로 보내지므로 변경 요청에는 CSRF 확인이 필요합니다.', '쿠키의 자동 전송과 별도 헤더 검증은 다른 역할입니다.', `
      <div class="session-comparison"><div><small>읽기 · GET /session/me</small><strong>JSESSIONID 자동 전송</strong><span>상태를 바꾸지 않는 조회</span></div><div><small>변경 · POST /session/logout</small><strong>JSESSIONID + X-CSRF-Token</strong><span>서버가 세션 속성의 값과 비교</span></div></div>
      <div class="session-cookie-properties"><span><b>HttpOnly</b> 스크립트 접근 제한</span><span><b>SameSite=Lax</b> 교차 사이트 전송 제한</span><span><b>Secure</b> 로컬 HTTP와 배포 HTTPS 설정 구별</span></div>
      <p class="session-note">Origin/CORS만으로 CSRF 검증을 대체하지 않습니다. 세션·CSRF 값을 URL·로그·화면 저장소에 넣지 마세요.</p>
    `)}

    <details class="db-journey-reference"><summary>장면별 이미지 시안 12장 보기</summary><p>이미지는 흐름 설명용입니다. 실제 쿠키·CSRF·회원 id는 로컬 응답에서 확인하세요.</p>
      ${['01-session-scenario','00-preparation','02-anonymous-csrf','07-csrf-failure','03-session-login','04-session-id-rotation','05-session-me','06-other-cookie','08-logout','10-jwt-session-lifetime','09-idle-timeout','11-cookie-csrf'].map((name) => `<a href="../../../docs/design/mockups-2026-10-16-batch19/${name}.png">${name}</a>`).join('')}
    </details>
  </section>`.replace(/[ \t]+\n/g, '\n');
}
