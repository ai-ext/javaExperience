document.querySelectorAll('.jwt-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-jwt-panel]')];
  const ids = ['L', 'W', 'U', 'K', 'V', 'P', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'M', 'M0', 'M1', 'M2', 'M3', 'M4'];
  const requests = new Map(ids.map((id) => [id, document.querySelector(`.api-request[data-request-id="${id}"]`)]));
  const serverUrl = document.querySelector('.lesson-scene .server-url');
  const cases = {
    login: ['L'], me: ['M'], credentials: ['W', 'U'], normalize: ['K'],
    validation: ['V1', 'V2', 'V3', 'V4', 'V'], anonymous: ['M0'],
    'jwt-errors': ['M3', 'M1', 'M2', 'M4'], 'password-boundary': ['P'], 'bad-json': ['V5', 'V6'],
  };
  const selected = Object.fromEntries(Object.entries(cases).map(([name, values]) => [name, values[0]]));
  const loginMessages = new Map();

  const updateComparison = () => {
    const target = journey.querySelector('[data-jwt-login-message]');
    if (!loginMessages.has('W') || !loginMessages.has('U')) {
      target.textContent = '두 요청을 모두 보내면 실제 응답의 message가 같은지 여기에 표시합니다.';
      return;
    }
    target.textContent = loginMessages.get('W') === loginMessages.get('U')
      ? '내 서버의 W·U message가 같습니다. 각 상태가 401인지도 응답에서 확인하세요.'
      : '내 서버의 W·U message가 다릅니다. 가입 여부가 드러나지 않게 같은 문구를 사용하세요.';
  };
  for (const [id, request] of requests) {
    if (!request) continue;
    journey.querySelector(`[data-jwt-request="${id}"]`)?.append(request);
    const editor = request.querySelector('.request-editor');
    const actions = editor?.querySelector('.request-actions');
    if (actions) editor.prepend(actions);
    const actual = journey.querySelector(`[data-jwt-actual="${id}"]`);
    const update = () => {
      const response = request.querySelector('.request-response');
      const status = response?.hidden
        ? request.querySelector('.request-status')?.textContent.trim()
        : response.querySelector('.response-status')?.textContent.trim();
      actual.textContent = status || '아직 실행 전';
      if ((id === 'W' || id === 'U') && response && !response.hidden) {
        try {
          const body = JSON.parse(response.querySelector('.response-body').textContent);
          if (typeof body.message === 'string') loginMessages.set(id, body.message);
          else loginMessages.delete(id);
        } catch { loginMessages.delete(id); }
        updateComparison();
      }
    };
    new MutationObserver(update).observe(request, { childList: true, subtree: true, attributes: true, characterData: true });
    update();
  }
  const showCase = (name, id) => {
    selected[name] = id;
    const panel = journey.querySelector(`[data-jwt-panel="${name}"]`);
    for (const pair of panel.querySelectorAll('[data-jwt-case]')) pair.hidden = pair.dataset.jwtCase !== id;
    for (const button of panel.querySelectorAll('[data-jwt-select]')) {
      button.setAttribute('aria-pressed', String(button.dataset.jwtSelect === id));
    }
    if (serverUrl) panel.querySelector(`[data-jwt-server="${id}"]`)?.append(serverUrl);
  };
  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.jwtPanel !== name;
    journey.dataset.jwtScreen = name;
    if (cases[name]) showCase(name, selected[name]);
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  journey.querySelectorAll('[data-jwt-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.jwtGo)));
  journey.querySelectorAll('[data-jwt-select]').forEach((button) => button.addEventListener('click', () =>
    showCase(button.closest('[data-jwt-panel]').dataset.jwtPanel, button.dataset.jwtSelect)));

  const parts = {
    header: ['header · 서명 방식', '<code>alg = HS256</code>. 서버는 허용한 알고리즘으로만 서명을 확인합니다.'],
    payload: ['payload · 읽을 수 있는 클레임', '<code>sub = "1"</code> · <code>iat = 발급 시각</code> · <code>exp = 발급 시각 + 3600초</code>. 개인정보·비밀번호를 넣지 않습니다.'],
    signature: ['signature · 위조 방지', '서버의 비밀키로 검증합니다. 값이 바뀌거나 만료되면 401로 처리합니다. 비밀키는 토큰에 들어가지 않습니다.'],
  };
  journey.querySelectorAll('[data-jwt-part]').forEach((button) => button.addEventListener('click', () => {
    for (const item of journey.querySelectorAll('[data-jwt-part]')) item.setAttribute('aria-pressed', String(item === button));
    const [title, body] = parts[button.dataset.jwtPart];
    journey.querySelector('[data-jwt-part-title]').textContent = title;
    journey.querySelector('[data-jwt-part-body]').innerHTML = body;
  }));

  const revealRequest = () => {
    const hit = [...requests.entries()].find(([, request]) => request && location.hash === `#${request.id}`);
    if (!hit) return;
    const name = Object.entries(cases).find(([, values]) => values.includes(hit[0]))?.[0];
    if (!name) return;
    selected[name] = hit[0];
    show(name);
  };
  window.addEventListener('hashchange', revealRequest);
  for (const [name, values] of Object.entries(cases)) showCase(name, values[0]);
  show('scenario');
  revealRequest();
});
