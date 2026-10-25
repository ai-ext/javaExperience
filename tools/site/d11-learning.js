const initialized = new WeakSet();

export function initD11Learning(doc = document, win = window) {
  const root = doc.querySelector('[data-d11-learning]');
  if (!root || initialized.has(root)) return;
  const { lessons: D11_LESSONS, assets: D11_ASSETS, assetRoot: d11AssetRoot } = JSON.parse(root.querySelector('[data-d11-data]')?.textContent || '{}');
  if (!D11_LESSONS?.length || !D11_ASSETS || !d11AssetRoot) return;
  initialized.add(root);
  const $ = selector => root.querySelector(selector);
  const key = '__javaExperienceD11';
  let lesson = D11_LESSONS.find(item => item.id === 'object-ownership');
  let index = 0, zoom = false, renderGeneration = 0, copyRequestId = 0;
  const element = (tag, value) => { const node = doc.createElement(tag); node.textContent = value; return node; };

  function revealOriginal() {
    let id;
    try { id = decodeURIComponent(win.location.hash.slice(1)); } catch { return; }
    const original = doc.getElementById('d11-original');
    const target = doc.getElementById(id);
    if (!original || !target || (target !== original && !original.contains(target))) return;
    let details = target.closest('details');
    while (details) { details.open = true; details = details.parentElement?.closest('details'); }
    if (target !== original && target.matches('h2,h3,h4,pre,code')) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }
  function save() {
    try { win.history.replaceState({ ...win.history.state, [key]: { topic: lesson.id, stage: lesson.stages[index].id } }, ''); }
    catch { /* 저장할 수 없어도 화면 전환은 계속 동작한다. */ }
  }
  function makeStageControls() {
    $('[data-d11-stages]').replaceChildren(...lesson.stages.map(item => {
      const button = element('button', item.title); button.type = 'button'; button.dataset.d11Stage = item.id;
      button.addEventListener('click', () => selectStage(item.id));
      return button;
    }));
  }
  function selectStage(id) {
    const next = lesson.stages.findIndex(item => item.id === id);
    if (next < 0) return;
    index = next; render(); save();
  }
  function render() {
    renderGeneration += 1;
    const current = lesson.stages[index], asset = D11_ASSETS[current.image];
    root.dataset.topic = lesson.id; root.dataset.stage = current.id;
    $('[data-d11-topic]').value = lesson.id;
    for (const [field, value] of [['question', lesson.question], ['source', lesson.source], ['title', current.title], ['lead', current.lead], ['note', current.note || lesson.note]]) $(`[data-d11-${field}]`).textContent = value;
    const image = $('[data-d11-image]');
    image.src = d11AssetRoot + asset.file; image.width = asset.width; image.height = asset.height;
    image.alt = `${asset.alt} · 현재 설명: ${current.title}`;
    $('[data-d11-image-link]').href = image.getAttribute('src');
    const focus = asset.focus?.[current.id], frame = $('.d11-image-frame'), imageWindow = $('.p09-image-window');
    const zoomed = zoom && Boolean(focus), overlay = $('[data-d11-focus]');
    overlay.hidden = !focus || zoomed;
    if (focus) for (const [property, value] of Object.entries({ left: focus[0], top: focus[1], width: focus[2], height: focus[3] })) overlay.style[property] = `${value}%`;
    frame.dataset.zoom = String(zoomed);
    const ratioNumber = zoomed ? asset.width * focus[2] / (asset.height * focus[3]) : 0;
    const ratio = zoomed ? String(ratioNumber) : '';
    frame.style.aspectRatio = ratio; imageWindow.style.aspectRatio = ratio;
    frame.style.setProperty('--d11-zoom-width', zoomed ? `${540 * ratioNumber}px` : '100%');
    imageWindow.style.setProperty('--p09-mobile-crop-width', zoomed ? `${asset.width * .85 * focus[2] / 100}px` : '100%');
    image.style.width = zoomed ? `${10000 / focus[2]}%` : '100%';
    image.style.transform = zoomed ? `translate(-${focus[0]}%, -${focus[1]}%)` : 'none';
    frame.scrollLeft = 0;
    $('[data-d11-zoom]').hidden = !focus;
    $('[data-d11-zoom]').setAttribute('aria-pressed', String(zoomed));
    $('[data-d11-zoom]').textContent = zoomed ? '전체 그림 보기' : '강조 구간 확대';
    $('[data-d11-figure-label]').textContent = zoomed ? '현재 구간 확대 · 그림 원본에서 세부를 읽어요' : '전체 학습 그림 · 현재 관측값은 아래에 표시';
    const visibleValues = current.bindParameters == null ? current.values : [...current.values, ['SQL bind parameters', JSON.stringify(current.bindParameters)]];
    $('[data-d11-state]').replaceChildren(...visibleValues.flatMap(([label, value]) => [element('dt', label), element('dd', value)]));
    $('[data-d11-evidence-kind]').textContent = current.evidenceKind;
    const sourceDetails = $('[data-d11-source-details]');
    sourceDetails.hidden = !(current.sourceFragments.length || current.evidence || current.fullEvidence || current.evidencePath);
    if (sourceDetails.dataset.stage !== current.id) sourceDetails.open = false;
    sourceDetails.dataset.stage = current.id;
    $('[data-d11-evidence]').textContent = current.evidence || current.note;
    const evidenceLink = $('[data-d11-evidence-link]'); evidenceLink.replaceChildren();
    if (current.evidencePath) {
      const link = element('a', '원자료 JSON 보기');
      link.href = `../../${current.evidencePath}`; link.target = '_blank'; link.rel = 'noopener'; evidenceLink.append(link);
    }
    $('[data-d11-code-kind]').textContent = codeKindLabel(current);
    const code = $('[data-d11-code]'); code.replaceChildren();
    current.code.split('\n').forEach((line, lineIndex, all) => {
      code.append(element(current.active.includes(lineIndex) ? 'mark' : 'span', line));
      if (lineIndex < all.length - 1) code.append(doc.createTextNode('\n'));
    });
    $('[data-d11-source-fragments]').replaceChildren(...current.sourceFragments.map(fragment => {
      const link = element('a', `${fragment.path}:${fragment.start}-${fragment.end}`);
      link.href = `../../${fragment.path}`; link.target = '_blank'; link.rel = 'noopener'; return link;
    }).flatMap((link, i) => i ? [element('span', ' · '), link] : [link]));
    $('[data-d11-source-code]').replaceChildren(...current.sourceFragments.map(fragment => {
      const block = doc.createElement('section');
      block.append(element('h4', `${fragment.path}:${fragment.start}-${fragment.end}`));
      const pre = doc.createElement('pre'); pre.append(element('code', fragment.content)); block.append(pre);
      return block;
    }));
    const details = $('[data-d11-full-evidence]');
    details.hidden = !current.fullEvidence;
    $('[data-d11-full-evidence-code]').textContent = current.fullEvidence || '';
    $('[data-d11-copy-status]').textContent = '';
    $('[data-d11-prev]').disabled = index === 0;
    $('[data-d11-next]').disabled = index === lesson.stages.length - 1;
    $('[data-d11-position]').textContent = `${index + 1} / ${lesson.stages.length}`;
    root.querySelectorAll('[data-d11-stage]').forEach(button => {
      if (button.dataset.d11Stage === current.id) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function codeKindLabel(current) {
    if (current.codeKind === 'additional-sqlite') return '추가 Python·SQLite 관측 발췌 · bind는 위 표에 별도 표시';
    if (current.codeKind === 'additional-python') return '추가 Python 관측 발췌';
    if (current.codeKind === 'additional-http-server-python') return 'Python fixture 서버 응답 조건 · Chrome 결과 별도';
    if (current.codeKind === 'additional-browser-dom') return '실제 Chrome DOM 관측 발췌';
    if (current.codeKind === 'original-java-unrun') return '원문 Java · 미실행';
    if (current.codeKind === 'original-groovy-unrun') return '원문 Gradle/Groovy · 미실행';
    if (current.codeKind === 'original-prose') return '원문 설명 · 실행 코드 아님';
    return '설명용 절차·실행 코드 아님';
  }
  function restore(record) {
    lesson = D11_LESSONS.find(item => item.id === record?.topic) || D11_LESSONS.find(item => item.id === 'object-ownership');
    const found = lesson.stages.findIndex(item => item.id === record?.stage);
    index = found < 0 ? 0 : found;
    makeStageControls(); render();
  }
  function move(delta) {
    const target = Math.max(0, Math.min(lesson.stages.length - 1, index + delta));
    if (target === index) return;
    const focused = doc.activeElement; index = target; render(); save();
    if (focused?.disabled) $(`[data-d11-stage="${lesson.stages[index].id}"]`)?.focus();
  }

  $('[data-d11-topic]').addEventListener('change', event => {
    lesson = D11_LESSONS.find(item => item.id === event.target.value) || D11_LESSONS[0];
    index = 0; makeStageControls(); render(); save();
  });
  $('[data-d11-prev]').addEventListener('click', () => move(-1));
  $('[data-d11-next]').addEventListener('click', () => move(1));
  $('[data-d11-stages]').addEventListener('keydown', event => {
    const button = event.target.closest('[data-d11-stage]');
    if (button && ['Enter', ' '].includes(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey) { event.preventDefault(); button.click(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    const buttons = [...root.querySelectorAll('[data-d11-stage]')], current = buttons.indexOf(doc.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1)));
    buttons[next].focus();
  });
  $('[data-d11-zoom]').addEventListener('click', () => { zoom = !zoom; render(); });
  $('[data-d11-copy]').addEventListener('click', async () => {
    const request = ++copyRequestId, generation = renderGeneration, payload = lesson.stages[index].code;
    try {
      await win.navigator.clipboard.writeText(payload);
      if (request === copyRequestId && generation === renderGeneration) $('[data-d11-copy-status]').textContent = '현재 코드 전체를 복사했습니다.';
    } catch {
      if (request !== copyRequestId || generation !== renderGeneration) return;
      const range = doc.createRange(); range.selectNodeContents($('[data-d11-code]'));
      const selection = win.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      $('[data-d11-copy-status]').textContent = '현재 표시된 코드를 선택했습니다. 복사 키를 눌러 주세요.';
    }
  });
  $('[data-d11-original-link]').addEventListener('click', () => {
    const original = doc.getElementById('d11-original'); if (original) original.open = true;
  });
  win.addEventListener('hashchange', revealOriginal);
  win.addEventListener('popstate', () => {
    const record = win.history.state?.[key];
    if (record) restore(record);
    else save();
    revealOriginal();
  });
  restore(win.history.state?.[key]);
  revealOriginal();
}

if (typeof document !== 'undefined') initD11Learning(document, window);
