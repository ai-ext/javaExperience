const HISTORY_KEY = '__javaExperienceP16';
const ROUTE = 'docs/knowledge/P16-json-jackson-practical.html';
const LESSON_REVISION = 1;
const READ_KEY = `javaexperience:knowledge:read:v1:${ROUTE}:${LESSON_REVISION}`;
const SESSION_PREFIX = 'javaexperience:p16:v1:entry:';
const SCENES = ['request', 'response-object', 'response-json'];
const LABELS = ['요청 인자 준비', '응답 객체 생성', '응답 JSON'];
const TITLES = ['Controller 호출 전 · 요청 인자를 준비해요', 'Controller 본문 · 응답 객체를 만들어요', 'Controller 반환 후 · 응답 JSON으로 써요'];
const LEADS = ['Spring MVC가 Jackson 기반 메시지 변환기를 통해 요청 본문을 읽습니다.', '준비된 request의 값을 읽어 OrderResponse를 만듭니다. 저장하거나 조회하는 코드는 없습니다.', 'Jackson 기반 메시지 변환기가 반환 객체를 JSON으로 씁니다. Java의 long 값은 JSON에서 숫자입니다.'];
const REQUEST = [['product', 'String', '"keyboard"'], ['quantity', 'int', '2']];
const RESPONSE = [['id', 'long', '1L'], ...REQUEST, ['createdAt', 'Instant', '2026-09-29T00:00:00Z']];
const RETURN_CODE = 'return new OrderResponse(1L, request.product(), request.quantity(),\n    Instant.parse("2026-09-29T00:00:00Z"));';

/** 설명용 장면과 명시적 읽음만 보관한다. 네트워크 요청이나 과제 진도 기록은 하지 않는다. */
export function initP16JsonVisual(doc = globalThis.document, win = doc?.defaultView) {
  const root = doc?.querySelector('[data-p16-visual]');
  if (!root || root.dataset.p16Ready) return;
  root.dataset.p16Ready = 'true';
  const $ = (selector) => root.querySelector(selector);
  let scene = 0; let failure = false; let entryId = null; let readAcknowledged = false; let restoredHref = null;
  const warnStorage = () => {
    const note = $('[data-p16-storage]');
    note.hidden = false; note.textContent = '이 브라우저에서는 이어보기·읽음 기록이 저장되지 않을 수 있습니다. 장면은 계속 볼 수 있습니다.';
  };
  const historySnapshot = () => {
    try { return win?.history.state?.[HISTORY_KEY]; } catch { warnStorage(); return null; }
  };
  const validSnapshot = (value) => value?.schema === 1 && value.route === ROUTE && value.lessonRevision === LESSON_REVISION && typeof value.entryId === 'string' && value.entryId.length <= 128 && SCENES.includes(value.sceneId);
  const newEntryId = () => win?.crypto?.randomUUID?.() || `p16-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const restoredToggles = new WeakMap();
  const sourceKey = (details) => details.id || details.querySelector(':scope > summary')?.id || null;
  const sourceDetails = () => [...doc.querySelectorAll('#p16-original, #p16-original details')];
  const snapshot = () => ({ schema: 1, entryId, route: ROUTE, lessonRevision: LESSON_REVISION, sceneId: SCENES[scene], inputVariant: failure ? 'invalid-quantity' : 'valid', view: doc.getElementById('p16-original')?.open ? 'original' : 'detail', expandedSourceIds: sourceDetails().filter((details) => details.open).map(sourceKey).filter(Boolean) });
  const cacheSnapshot = () => {
    if (!entryId) return;
    try { win?.sessionStorage.setItem(`${SESSION_PREFIX}${entryId}`, JSON.stringify(snapshot())); } catch { warnStorage(); }
  };
  const persist = () => {
    if (!entryId) return;
    cacheSnapshot();
    try {
      const current = win?.history.state;
      win?.history.replaceState({ ...(current && typeof current === 'object' ? current : {}), [HISTORY_KEY]: snapshot() }, '');
    } catch { warnStorage(); }
  };
  const loadEntry = (state) => {
    if (!validSnapshot(state)) return false;
    let saved = state;
    try {
      const cached = JSON.parse(win?.sessionStorage.getItem(`${SESSION_PREFIX}${state.entryId}`) || 'null');
      if (validSnapshot(cached) && cached.entryId === state.entryId) saved = cached;
    } catch { warnStorage(); }
    entryId = saved.entryId; failure = saved.inputVariant === 'invalid-quantity'; scene = failure ? 0 : SCENES.indexOf(saved.sceneId);
    const expanded = new Set(Array.isArray(saved.expandedSourceIds) ? saved.expandedSourceIds.filter((id) => typeof id === 'string') : []);
    for (const details of sourceDetails()) {
      const open = expanded.has(sourceKey(details));
      if (details.open !== open) { restoredToggles.set(details, open); details.open = open; }
    }
    return true;
  };
  const loadRead = () => {
    try {
      const value = JSON.parse(win?.localStorage.getItem(READ_KEY) || 'null');
      readAcknowledged = value?.schema === 1 && value.route === ROUTE && value.lessonRevision === LESSON_REVISION && value.read === true;
    } catch { warnStorage(); }
  };
  const toggleRead = () => {
    readAcknowledged = !readAcknowledged;
    try {
      if (readAcknowledged) win?.localStorage.setItem(READ_KEY, JSON.stringify({ schema: 1, route: ROUTE, lessonRevision: LESSON_REVISION, read: true }));
      else win?.localStorage.removeItem(READ_KEY);
    } catch { warnStorage(); }
    render();
  };
  const create = (tag, text, className) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  function tablePanel(title, type, rows) {
    const table = create('table'); const head = create('thead'); const tr = create('tr');
    for (const name of ['필드', '타입', '값']) { const th = create('th', name); th.scope = 'col'; tr.append(th); }
    head.append(tr); const body = create('tbody');
    for (const row of rows) { const line = create('tr'); for (const value of row) line.append(create('td', value)); body.append(line); }
    table.append(head, body); return [create('h3', title), create('p', type, 'p16-type'), table];
  }
  function jsonPanel(title, request) {
    const pre = create('pre'); const code = create('code');
    const values = request ? { product: 'keyboard', quantity: failure ? 'two' : 2 } : { id: 1, product: 'keyboard', quantity: 2, createdAt: '2026-09-29T00:00:00Z' };
    code.append(doc.createTextNode('{\n'));
    Object.entries(values).forEach(([key, value], index, array) => {
      code.append(doc.createTextNode(`  "${key}": `), create('span', JSON.stringify(value), failure && key === 'quantity' ? 'p16-invalid-value' : 'p16-json-value'), doc.createTextNode(index < array.length - 1 ? ',\n' : '\n'));
    });
    code.append(doc.createTextNode('}')); pre.append(code);
    return [create('h3', title), create('strong', request ? 'POST /orders' : '200 OK · 예제 예상 응답', 'p16-endpoint'), create('p', 'Content-Type: application/json', 'p16-meta'), pre];
  }
  function render() {
    $('[data-p16-title]').textContent = failure ? '요청 변환 실패 · Controller 본문은 호출되지 않아요' : TITLES[scene];
    $('[data-p16-lead]').textContent = failure ? '문자열 "two"를 int 수량으로 읽을 수 없어 요청 인자를 준비하는 중에 멈춥니다.' : LEADS[scene];
    const left = $('[data-p16-left]'); const right = $('[data-p16-right]');
    root.classList.toggle('p16-failure', failure);
    if (scene === 0) {
      left.replaceChildren(...jsonPanel('HTTP 요청 JSON', true));
      if (failure) {
        right.replaceChildren(create('h3', '요청 객체를 준비하지 못했어요'), create('p', 'CreateOrderRequest 생성 실패', 'p16-type'), create('p', 'quantity: "two" → int 변환 불가', 'p16-error-value'), create('p', '400 Bad Request · 예상 결과', 'p16-error-status'), create('code', 'HttpMessageNotReadableException', 'p16-exception'), create('p', 'Controller 본문 미호출 · OrderResponse도 만들지 않습니다.', 'p16-error-explanation'));
      } else right.replaceChildren(...tablePanel('Java 요청 객체', 'CreateOrderRequest', REQUEST));
    } else if (scene === 1) {
      left.replaceChildren(...tablePanel('입력으로 받은 요청 객체', 'CreateOrderRequest request', REQUEST));
      right.replaceChildren(...tablePanel('새로 만든 응답 객체', 'OrderResponse', RESPONSE));
    } else {
      left.replaceChildren(...tablePanel('Controller가 반환한 객체', 'OrderResponse', RESPONSE));
      right.replaceChildren(...jsonPanel('HTTP 응답 JSON', false));
    }
    const code = $('[data-p16-code]'); code.replaceChildren();
    if (scene === 0) code.append(doc.createTextNode('OrderResponse create('), create('mark', '@RequestBody CreateOrderRequest request'), doc.createTextNode(') {'));
    else if (scene === 1) code.append(create('mark', RETURN_CODE));
    else code.textContent = RETURN_CODE;
    $('[data-p16-code-label]').textContent = ['지금 보는 코드 · 인자 준비 구간', '지금 보는 코드 · 응답 객체 생성', '원문 코드 · 반환한 객체를 메시지 변환기가 읽어요'][scene];
    $('.p16-code-note').textContent = scene === 0 ? '강조는 학습 위치이며 실행 중인 줄을 뜻하지 않습니다. 아직 Controller 본문은 호출되지 않았습니다.' : scene === 1 ? '강조는 학습 위치이며 실행 중인 줄을 뜻하지 않습니다. DB 저장 없이 고정 id와 시각으로 객체를 만듭니다.' : 'JSON 변환은 Controller가 반환한 뒤 이루어집니다. 위 코드는 원문의 반환 구문이며, 실시간 실행 표시는 아닙니다.';
    $('[data-p16-prev]').disabled = scene === 0;
    const next = $('[data-p16-next]');
    next.disabled = false;
    next.textContent = failure ? '정상값 2로 돌아가기' : scene === 0 ? '다음: 응답 객체 만들기 →' : scene === 1 ? '다음: 응답 JSON 보기 →' : readAcknowledged ? '읽음 표시 해제' : '이 예제 읽음으로 표시';
    if (scene === 2 && !failure) { next.dataset.p16Read = ''; next.setAttribute('aria-pressed', String(readAcknowledged)); }
    else { delete next.dataset.p16Read; next.removeAttribute('aria-pressed'); }
    $('[data-p16-read-note]').hidden = scene !== 2 || failure;
    $('[data-p16-read-note]').textContent = `${readAcknowledged ? '이 예제를 읽음으로 표시했어요. ' : ''}읽음 표시는 학습 확인용이며 자동 채점·API 실행 통과·과제 진도와 별도로 보관합니다.`;
    $('[data-p16-error-toggle]').setAttribute('aria-pressed', String(failure));
    $('[data-p16-error-toggle]').textContent = failure ? '수량 2로 돌아가기' : '수량이 "two"라면?';
    for (const button of root.querySelectorAll('[data-p16-step]')) { const index = Number(button.dataset.p16Step); button.disabled = false; if (index === scene) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); }
    const select = $('[data-p16-select]'); select.value = String(scene);
    for (const option of select.options) option.disabled = false;
    $('[data-p16-status]').textContent = failure ? '요청 변환 실패의 예상 장면 · Controller 본문 미호출 · 실제 서버 결과 아님' : `${scene + 1}/3 · ${LABELS[scene]} · 설명용 예상 장면`;
  }
  function go(value) { failure = false; scene = Math.max(0, Math.min(2, value)); render(); persist(); }
  for (const button of root.querySelectorAll('[data-p16-step]')) button.addEventListener('click', () => go(Number(button.dataset.p16Step)));
  $('[data-p16-prev]').addEventListener('click', () => go(scene - 1));
  $('[data-p16-next]').addEventListener('click', () => { if (failure) go(0); else if (scene === 2) toggleRead(); else go(scene + 1); });
  $('[data-p16-select]').addEventListener('change', (event) => go(Number(event.target.value)));
  $('[data-p16-error-toggle]').addEventListener('click', () => { failure = !failure; scene = 0; render(); persist(); });
  root.addEventListener('keydown', (event) => {
    if (!event.target.closest('[data-p16-navigation], [data-p16-title]')) return;
    if (event.target.tagName === 'SELECT' || event.altKey || event.ctrlKey || event.metaKey) return;
    const focused = Number(event.target.closest('[data-p16-step]')?.dataset.p16Step ?? scene);
    const targets = { ArrowLeft: focused - 1, ArrowRight: focused + 1, Home: 0, End: 2 };
    if (!(event.key in targets)) return; event.preventDefault();
    root.querySelector(`[data-p16-step="${Math.max(0, Math.min(2, targets[event.key]))}"]`)?.focus();
  });
  // 원문을 감싼 바깥 details도 열어 기존 깊은 앵커가 계속 보이게 한다.
  const revealOriginal = (hash) => {
    let id; try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const original = doc.getElementById('p16-original');
    const target = doc.getElementById(id);
    if (original && target && (target === original || original.contains(target))) {
      let node = target; while (node && original.contains(node)) { if (node.tagName === 'DETAILS') node.open = true; node = node.parentElement; }
      original.open = true;
    }
  };
  doc.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]'); if (link) { revealOriginal(link.hash); persist(); }
  });
  doc.addEventListener('toggle', (event) => {
    if (!event.target.matches?.('#p16-original, #p16-original details')) return;
    const restoredOpen = restoredToggles.get(event.target); restoredToggles.delete(event.target);
    if (restoredOpen === event.target.open) return;
    persist();
  }, true);
  win?.addEventListener('pagehide', cacheSnapshot);
  win?.addEventListener('popstate', () => {
    // 출발 entry는 session에만 보관하고 목적지 history를 덮어쓰지 않는다.
    cacheSnapshot();
    const destination = historySnapshot();
    if (loadEntry(destination)) { restoredHref = win.location.href; render(); }
    else entryId = null;
  });
  win?.addEventListener('hashchange', () => {
    if (restoredHref === win.location.href) { restoredHref = null; return; }
    const destination = historySnapshot();
    if (validSnapshot(destination) && destination.entryId !== entryId) { loadEntry(destination); render(); return; }
    cacheSnapshot(); entryId = newEntryId(); revealOriginal(win.location.hash); persist();
  });
  win?.addEventListener('storage', (event) => { if (event.key === READ_KEY) { loadRead(); render(); } });
  const restored = loadEntry(historySnapshot());
  if (!restored) { entryId = newEntryId(); if (win?.location.hash) revealOriginal(win.location.hash); }
  loadRead(); render(); persist();
}
