/** 10-4: JWT 발급, 재요청 검증, 별도 회원 조회, 실패 조건을 한 장면씩 배운다. */
const screens = ['scenario', 'dependencies', 'config', 'issuance', 'login', 'anatomy', 'me', 'credentials', 'normalize', 'validation', 'anonymous', 'jwt-errors', 'password-boundary', 'bad-json', 'preflight'];
const nav = (name, label = '다음 장면') => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions jwt-actions">
    ${index ? `<button type="button" class="db-journey-back" data-jwt-go="${screens[index - 1]}">← 이전 장면</button>` : '<span></span>'}
    ${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-jwt-go="${screens[index + 1]}">${label} →</button>` : '<a class="db-journey-next" href="10-5-create-post.html">다음 과제 →</a>'}
  </footer>`;
};
const panel = (name, kicker, title, lead, body, nextLabel) => `<article class="db-journey-screen jwt-screen" data-jwt-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="jwt-${name}-title">
  <p class="db-journey-kicker">${kicker}</p><h2 id="jwt-${name}-title">${title}</h2>${lead ? `<p class="db-journey-lead">${lead}</p>` : ''}
  ${body}${nav(name, nextLabel)}</article>`;
const choose = (ids, names) => `<div class="jwt-case-choice" role="group" aria-label="확인할 요청 고르기">${ids.map((id, index) => `<button type="button" data-jwt-select="${id}" aria-pressed="${index === 0}">${names[index]}</button>`).join('')}</div>`;
const run = (id, result, note) => `<div class="jwt-run-pair" data-jwt-case="${id}">
  <div class="db-journey-console"><header><strong>${id} · 내 서버에서 실행</strong><small>원문 요청을 그대로 사용</small></header><div data-jwt-server="${id}"></div><div data-jwt-request="${id}"></div></div>
  <aside class="db-journey-expect"><p>구현 후 기대값 · 실행 결과 아님</p><strong>${result}</strong><span>${note}</span><hr><p>내 서버 결과</p><strong class="db-journey-actual" data-jwt-actual="${id}">아직 실행 전</strong></aside>
</div>`;

export function renderJwtLoginJourney() {
  return `<section class="first-db-journey jwt-journey" data-jwt-screen="scenario" aria-label="10-4 JWT 로그인과 내 정보">
    ${panel('scenario', '10-4 · JWT 로그인', '로그인은 했는데 다음 요청에서 서버가 저를 어떻게 알까요?', '로그인 뒤 받은 토큰을 다음 요청에 보내 내 정보를 확인하는 흐름을 직접 만듭니다.', `
      <div class="jwt-scenario"><div><small>첫 요청</small><strong>이메일·비밀번호로 로그인</strong></div><b>→</b><div><small>다음 요청</small><strong>내 정보 보기</strong></div></div>
      <dl class="db-journey-brief"><div><dt>만들 것</dt><dd><code>POST /api/v1/auth/login</code>과 <code>GET /api/v1/users/me</code> 연결</dd></div><div><dt>먼저 보낼 것</dt><dd><code>POST /api/v1/auth/login</code></dd></div></dl>
    `, '라이브러리 준비')}

    ${panel('dependencies', '10-4 · build.gradle', 'JWT 라이브러리 세 부분을 추가하세요.', '이번 화면에서 수정할 파일은 <code>build.gradle</code> 하나입니다.', `
      <div class="jwt-code-grid"><div class="jwt-code-surface"><header><strong>build.gradle</strong><small>jjwt 0.13.0</small></header><pre><code>implementation 'io.jsonwebtoken:jjwt-api:0.13.0'
runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.13.0'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.13.0'</code></pre></div><div class="jwt-facts"><div><strong>jjwt-api</strong><span>컴파일할 때 사용하는 타입</span></div><div><strong>jjwt-impl</strong><span>실행 때 서명·파싱 구현</span></div><div><strong>jjwt-jackson</strong><span>클레임 JSON 처리</span></div></div></div>
      <a class="jwt-reference-link" href="#만들-것" data-task-open="true">의존성 원문 열기 ↗</a>
    `, '설정 확인')}

    ${panel('config', '10-4 · application.yml', '비밀키와 한 시간 유효 기간을 설정하세요.', '<code>app.jwt.secret</code>은 HS256용 32바이트 이상입니다. 원문에 공개된 값은 로컬 실습 예시입니다.', `
      <div class="jwt-config"><div class="jwt-code-surface"><header><strong>application.yml</strong><small>설정 이름과 단위</small></header><pre><code>app:
  jwt:
    secret: (원문 예시 키 또는 환경 변수)
    validity-seconds: 3600</code></pre></div><div class="jwt-facts"><div><strong>secret · 32바이트 이상</strong><span>서명·검증에 쓰는 키. 실제 서비스는 별도 비밀 저장소나 환경 변수로 주입</span></div><div><strong>3600초</strong><span>발급 시각부터 한 시간</span></div><div><strong>M3 만료 예제</strong><span>원문의 예시 키로 서명됨. 다른 키라면 서명 실패여도 401</span></div></div></div>
      <a class="jwt-reference-link" href="#설정" data-task-open="true">원문 설정·예시 키 범위 보기 ↗</a>
    `, '발급 흐름')}

    ${panel('issuance', '10-4 · 로그인 서버 흐름', '회원 조회와 비밀번호 확인 뒤 JWT에 서명합니다.', '이번 장면은 로그인 발급까지만 봅니다. 다음 요청의 인증은 뒤 장면입니다.', `
      <div class="jwt-flow"><div><small>POST /auth/login</small><strong>email · password</strong></div><b>→</b><div><small>users 조회</small><strong>passwordEncoder.matches</strong></div><b>→</b><div><small>JwtProvider.issue</small><strong>HS256 · sub=회원 id</strong></div><b>→</b><div><small>응답 data</small><strong>accessToken · 3600초</strong></div></div>
      <p class="jwt-note">JWT 문자열은 <code>api_token</code> 표에 저장하지 않습니다. 비밀번호 해시는 회원 확인에만 쓰고 페이로드에 넣지 않습니다.</p>
      <a class="jwt-reference-link" href="#구현-가이드" data-task-open="true">AuthService·JwtProvider 구현 가이드 열기 ↗</a>
    `, '로그인 요청 보내기')}

    ${panel('login', '10-4 · 로그인 요청 L', '로그인 요청을 보내고 발급된 JWT를 확인하세요.', '정상 응답의 토큰을 다음 내 정보 요청 M에서 사용합니다.', `
      ${run('L', '200 OK', 'data.accessToken · 점으로 구분된 세 부분 / data.expiresIn = 3600')}
      <p class="jwt-note">실제 토큰은 학습용 실행 패널의 메모리에서 다음 요청에만 전달합니다. 이 화면은 토큰을 별도 파일이나 로그에 저장하지 않습니다.</p>
    `, 'JWT 구조 보기')}

    ${panel('anatomy', '10-4 · JWT의 의미', 'JWT는 숨기는 봉투가 아니라 위조를 막는 서명입니다.', '세 부분 중 payload는 읽을 수 있습니다. 비밀번호나 비밀키를 담지 않습니다.', `
      <div class="jwt-parts" role="group" aria-label="JWT 부분 선택"><button type="button" data-jwt-part="header" aria-pressed="false">header</button><b>.</b><button type="button" data-jwt-part="payload" aria-pressed="true">payload</button><b>.</b><button type="button" data-jwt-part="signature" aria-pressed="false">signature</button></div>
      <div class="jwt-part-content" aria-live="polite"><strong data-jwt-part-title>payload · 읽을 수 있는 클레임</strong><p data-jwt-part-body><code>sub = "1"</code> · <code>iat = 발급 시각</code> · <code>exp = 발급 시각 + 3600초</code>. 개인정보·비밀번호를 넣지 않습니다.</p></div>
      <div class="jwt-two-checks"><div><small>토큰 검증</small><strong>서명·만료 확인</strong><span><code>api_token</code> 조회 없음</span></div><div><small>내 정보 조회</small><strong>users 행 다시 읽기</strong><span>검증한 <code>sub</code>의 현재 정보</span></div></div>
      <a class="jwt-reference-link" href="#설계-포인트" data-task-open="true">서명·암호화 구분 원문 열기 ↗</a>
    `, '내 정보 요청')}

    ${panel('me', '10-4 · 내 정보 요청 M', 'JWT로 회원 번호를 확인한 뒤 내 정보는 DB에서 읽습니다.', '요청 M은 앞의 로그인 L 응답에서 받은 토큰을 자동 참조합니다. 먼저 L을 실행하세요.', `
      <div class="jwt-me-flow"><div><small>AuthInterceptor</small><strong>서명·만료 확인 → sub=1</strong></div><b>→</b><div><small>@LoginUser</small><strong>userId=1</strong></div><b>→</b><div><small>UserService.me</small><strong>users.id=1 조회</strong></div></div>
      ${run('M', '200 OK', 'data = {id: 1, email: kim@example.com, nickname: 김자바} · passwordHash 없음')}
    `, '로그인 실패 비교')}

    ${panel('credentials', '10-4 · 로그인 실패 W·U', '이메일이 없든 비밀번호가 틀리든 같은 401입니다.', '가입 여부가 응답 문구로 드러나지 않도록 두 실패를 대조합니다.', `
      ${choose(['W', 'U'], ['W · 틀린 비밀번호', 'U · 없는 이메일'])}
      ${run('W', '401 UNAUTHORIZED', 'WWW-Authenticate: Bearer · U와 같은 message')}
      ${run('U', '401 UNAUTHORIZED', 'W와 같은 message · 회원 존재 여부를 드러내지 않음')}
      <p class="jwt-note" data-jwt-login-message>두 요청을 모두 보내면 실제 응답의 message가 같은지 여기에 표시합니다.</p>
    `, '이메일 정규화')}

    ${panel('normalize', '10-4 · 로그인 요청 K', '이메일 공백과 대소문자를 맞춰 찾으세요.', '가입 때 사용한 규칙으로 다듬은 뒤 회원을 조회합니다.', `
      <div class="jwt-me-flow"><div><small>요청</small><strong>앞뒤 공백·대문자</strong></div><b>→</b><div><small>LoginRequest</small><strong>strip · 소문자</strong></div><b>→</b><div><small>users.email</small><strong>kim@example.com</strong></div></div>
      ${run('K', '200 OK', '정규화 후 기존 회원을 찾아 data.accessToken 발급')}
    `, '빈 값 검증')}

    ${panel('validation', '10-4 · 값 검증 V·V1–V4', '로그인 값이 비었으면 회원 조회 전에 400입니다.', '<code>@NotBlank</code>는 없음·null·빈 문자열·공백을 막습니다. 가입 때의 길이 규칙은 다시 걸지 않습니다.', `
      ${choose(['V1', 'V2', 'V3', 'V4', 'V'], ['V1 · 빈 객체', 'V2 · 빈 문자열', 'V3 · 이메일 null', 'V4 · 비밀번호 공백', 'V · 비밀번호 빠짐'])}
      ${run('V1', '400 VALIDATION_FAILED', 'errors[*].field에 email과 password 둘 다')}
      ${run('V2', '400 VALIDATION_FAILED', 'email과 password 둘 다')}
      ${run('V3', '400 VALIDATION_FAILED', 'email')}
      ${run('V4', '400 VALIDATION_FAILED', 'password')}
      ${run('V', '400 VALIDATION_FAILED', 'password')}
    `, '내 정보 익명 요청')}

    ${panel('anonymous', '10-4 · 인증이 필요한 GET M0', 'GET은 익명으로 지나가도 내 정보는 로그인해야 합니다.', '헤더 없는 GET은 인터셉터를 지나지만, 이 API의 <code>@LoginUser</code>는 필수입니다.', `
      <div class="jwt-me-flow"><div><small>AuthInterceptor</small><strong>GET + 헤더 없음 → 익명 통과</strong></div><b>→</b><div><small>@LoginUser(required=true)</small><strong>userId 없음 → 401</strong></div></div>
      ${run('M0', '401 UNAUTHORIZED', 'WWW-Authenticate: Bearer · errors=[] · data=null')}
    `, '잘못된 JWT')}

    ${panel('jwt-errors', '10-4 · 토큰 실패 M1–M4', '보낸 JWT가 틀리거나 만료됐으면 401입니다.', '헤더가 있다면 GET도 토큰을 확인합니다. 하나씩 원인을 바꿔 보세요.', `
      ${choose(['M3', 'M1', 'M2', 'M4'], ['M3 · 만료', 'M1 · Bearer 아님', 'M2 · 서명 틀림', 'M4 · 모양 오류'])}
      ${run('M3', '401 UNAUTHORIZED', '만료 예제는 원문 로컬 키로 서명됨. 다른 키면 서명 실패여도 401')}
      ${run('M1', '401 UNAUTHORIZED', 'Bearer 형식 아님')}
      ${run('M2', '401 UNAUTHORIZED', '서명 검증 실패')}
      ${run('M4', '401 UNAUTHORIZED', 'JWT 구조·파싱 실패')}
      <p class="jwt-note">실패한 토큰으로는 users 조회에 들어가지 않습니다. jjwt 예외를 응답에 그대로 노출하지 않습니다.</p>
    `, '비밀번호 경계')}

    ${panel('password-boundary', '10-4 · 로그인 비밀번호 P', '로그인에 가입 때의 72바이트 제한을 다시 걸지 않습니다.', '한글 25자(UTF-8 75바이트) 입력이 틀린 비밀번호처럼 처리되는지 확인합니다.', `
      <div class="jwt-ruler"><div><small>가입 시 정한 비밀번호</small><strong>72바이트까지 허용</strong></div><b>→</b><div><small>이번 로그인 입력</small><strong>75바이트 · 가입 규칙 재검사 없음</strong></div><b>→</b><div><small>matches 결과</small><strong>불일치 → 401</strong></div></div>
      ${run('P', '401 UNAUTHORIZED', 'W와 같은 message · 500이면 로그인에서 encode를 호출했는지 확인')}
    `, '깨진 JSON')}

    ${panel('bad-json', '10-4 · 본문 형식 V5·V6', 'JSON 자체를 읽지 못하면 BAD_JSON으로 답합니다.', '필드 검증보다 앞선 본문 해석 단계에서 실패합니다.', `
      ${choose(['V5', 'V6'], ['V5 · 깨진 JSON', 'V6 · 비밀번호 배열'])}
      ${run('V5', '400 BAD_JSON', 'JSON 문법이 깨져 LoginRequest를 만들 수 없음')}
      ${run('V6', '400 BAD_JSON', 'password는 문자열이어야 하며 배열을 받을 수 없음')}
    `, '사전 요청 확인')}

    ${panel('preflight', '10-4 · CORS 사전 요청 M5', 'OPTIONS에는 아직 JWT가 없습니다.', '브라우저 실행 버튼으로 OPTIONS를 직접 만들 수 없어 Postman에서 수동 확인합니다.', `
      <div class="jwt-preflight"><div class="jwt-code-surface"><header><strong>Postman 요청 M5 · 수동</strong><small>인증 헤더 없음</small></header><pre><code>OPTIONS /api/v1/users/me
Origin: http://localhost:3000
Access-Control-Request-Method: GET
Access-Control-Request-Headers: authorization</code></pre></div><div class="jwt-facts"><div><strong>CorsUtils.isPreFlightRequest</strong><span>JWT 확인을 건너뜀</span></div><div><strong>기대값 · 실행 전</strong><span>HTTP 200 · Access-Control-Allow-Headers에 authorization</span></div><div><strong>실제 결과</strong><span>Postman에서 확인 전</span></div></div></div>
      <p class="jwt-note">이 화면의 그림은 설명용입니다. 실제 OPTIONS를 보냈다고 표시하지 않습니다.</p>
    `)}

    <details class="db-journey-reference"><summary>장면별 이미지 시안 15장 보기</summary><p>예상값·설명용 그림과 내 서버 결과를 구분합니다. 원문 요청·코드가 정확성 기준입니다.</p>
      ${['01-jwt-scenario', '14-dependencies', '15-config', '02-login-issue-flow', '03-login-request', '04-jwt-anatomy', '05-me-request', '06-login-failure', '07-email-normalize', '08-validation', '09-me-anonymous', '10-jwt-expired', '11-long-password', '12-bad-json', '13-preflight'].map((name) => `<a href="../../docs/design/mockups-2026-10-16-batch18/${name}.jpg">${name}</a>`).join('')}
    </details>
  </section>`.replace(/[ \t]+\n/g, '\n');
}
