import { S08_LESSONS, S08_ASSETS, s08AssetRoot, S08_RUNS } from './s08-lesson-data.mjs';

export function initS08Learning(doc = document, win = window) {
  const root = doc.querySelector('[data-s08-learning]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  function revealSource() {
    let id; try { id = decodeURIComponent(win.location.hash.slice(1)); } catch { return; }
    const original = doc.getElementById('s08-original'), target = doc.getElementById(id);
    if (!original || !target || (target !== original && !original.contains(target))) return;
    let details = target.closest('details');
    while (details && (details === original || original.contains(details))) { details.open = true; details = details.parentElement?.closest('details'); }
  }
  root.querySelector('a[href="#s08-original"]')?.addEventListener('click', () => { const original = doc.getElementById('s08-original'); if (original) original.open = true; });
  win.addEventListener('hashchange', revealSource);
  revealSource();
  const available = S08_LESSONS.filter(lesson => lesson.stages.every(stage => S08_ASSETS[stage.image]?.ready === true));
  if (!available.length) return;
  const $ = selector => root.querySelector(selector);
  const key = '__javaExperienceS08', mobile = win.matchMedia?.('(max-width:700px)');
  let lesson = available[0], index = 0, zoom = mobile?.matches === true, zoomManual = false;
  let copyGeneration = 0, copyRequest = 0;
  const element = (tag, text) => { const node = doc.createElement(tag); node.textContent = text; return node; };
  function save() {
    try { win.history.replaceState({ ...win.history.state, [key]: { topic: lesson.id, stage: lesson.stages[index].id } }, ''); }
    catch { /* history를 쓸 수 없어도 현재 학습 장면은 계속 조작할 수 있다. */ }
  }
  function renderStages() {
    $('[data-s08-stage-select]').replaceChildren(...lesson.stages.map((stage, i) => { const option = element('option', `${i + 1}/${lesson.stages.length} · ${stage.title}`); option.value = stage.id; return option; }));
    $('[data-s08-stages]').replaceChildren(...lesson.stages.map((stage, i) => {
      const button = element('button', stage.title); button.type = 'button'; button.dataset.s08Stage = stage.id;
      button.addEventListener('click', () => { index = i; render(); save(); }); return button;
    }));
  }
  function render() {
    copyGeneration++;
    const stage = lesson.stages[index], asset = S08_ASSETS[stage.image];
    root.dataset.topic = lesson.id; root.dataset.stage = stage.id;
    $('[data-s08-topic]').value = lesson.id;
    for (const [field, value] of [['question', lesson.question], ['source', lesson.source], ['title', stage.title], ['lead', stage.lead], ['note', stage.note || lesson.note], ['source-note', stage.sourceNote || lesson.sourceNote || '']]) $(`[data-s08-${field}]`).textContent = value;
    const img = $('[data-s08-image]'); img.src = s08AssetRoot + asset.file; img.alt = asset.alt + ' · 현재 설명: ' + stage.title; img.width = asset.width; img.height = asset.height;
    $('[data-s08-image-link]').href = img.getAttribute('src');
    const focus = asset.focus?.[stage.id], overlay = $('[data-s08-focus]'), zoomed = zoom && Boolean(focus);
    overlay.hidden = !focus || zoomed;
    if (focus) for (const [property, value] of Object.entries({ left: focus[0], top: focus[1], width: focus[2], height: focus[3] })) overlay.style[property] = value + '%';
    const frame = $('.s08-image-frame'), imageWindow = $('.p09-image-window'); frame.dataset.zoom = String(zoomed);
    const ratio = zoomed ? String(asset.width * focus[2] / (asset.height * focus[3])) : '';
    frame.style.aspectRatio = ratio; imageWindow.style.aspectRatio = ratio;
    imageWindow.style.setProperty('--p09-mobile-crop-width', zoomed ? `${asset.width * .85 * focus[2] / 100}px` : '100%'); frame.scrollLeft = 0;
    if (zoomed && mobile?.matches) { frame.tabIndex = 0; frame.setAttribute('aria-label', '확대한 그림 · 좌우로 이동해 읽기'); }
    else { frame.removeAttribute('tabindex'); frame.removeAttribute('aria-label'); }
    img.style.width = zoomed ? 10000 / focus[2] + '%' : '100%'; img.style.transform = zoomed ? `translate(-${focus[0]}%, -${focus[1]}%)` : 'none';
    $('[data-s08-zoom]').hidden = !focus; $('[data-s08-zoom]').setAttribute('aria-pressed', String(zoomed)); $('[data-s08-zoom]').textContent = zoomed ? '전체 그림 보기' : '강조 구간 확대';
    $('[data-s08-figure-label]').textContent = zoomed ? (mobile?.matches ? '현재 구간 확대 · 그림을 좌우로 밀어 읽어요' : '현재 강조 구간을 확대한 그림') : '전체 관계 그림 · 현재 값은 아래에서 확인해요';
    $('[data-s08-state]').replaceChildren(...stage.values.flatMap(([label, value]) => [element('dt', label), element('dd', value)]));
    const code = $('[data-s08-code]'); code.replaceChildren();
    stage.code.split('\n').forEach((line, i, lines) => { code.append(element(stage.active.includes(i) ? 'mark' : 'span', line || ' ')); if (i < lines.length - 1) code.append(doc.createTextNode('\n')); });
    $('[data-s08-copy-status]').textContent = '';
    const output = $('[data-s08-output]'); output.hidden = !(stage.checks.length || stage.runKeys.length);
    if (output.dataset.stage !== stage.id) output.open = false;
    output.dataset.stage = stage.id;
    $('[data-s08-stdout]').textContent = stage.checks.map(check => 'PASS ' + check).join('\n');
    $('[data-s08-stdout]').parentElement.hidden = !stage.checks.length;
    const runs = $('[data-s08-runs]'); runs.replaceChildren();
    for (const run of stage.runKeys) {
      const pre = element('pre', ''); pre.append(element('code', JSON.stringify(S08_RUNS[run], null, 2)));
      runs.append(element('h4', run + ' · 실제 추가 실험 관측'), pre);
    }
    for (const type of ['prev', 'mobile-prev']) $(`[data-s08-${type}]`).disabled = index === 0;
    for (const type of ['next', 'mobile-next']) $(`[data-s08-${type}]`).disabled = index === lesson.stages.length - 1;
    $('[data-s08-position]').textContent = `${index + 1} / ${lesson.stages.length}`;
    $('[data-s08-stage-select]').value = stage.id;
    root.querySelectorAll('[data-s08-stage]').forEach(button => { if (button.dataset.s08Stage === stage.id) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
  }
  function restore(record) {
    lesson = available.find(item => item.id === record?.topic) || available[0];
    const next = lesson.stages.findIndex(stage => stage.id === record?.stage); index = next < 0 ? 0 : next;
    renderStages(); render();
  }
  $('[data-s08-topic]').addEventListener('change', event => { restore({ topic: event.target.value }); save(); });
  $('[data-s08-stage-select]').addEventListener('change', event => { const next = lesson.stages.findIndex(stage => stage.id === event.target.value); if (next >= 0) { index = next; render(); save(); } });
  function moveStep(delta) {
    const next = Math.max(0, Math.min(lesson.stages.length - 1, index + delta)); if (next === index) return;
    const focused = doc.activeElement; index = next; render(); save();
    if (focused?.disabled) (mobile?.matches ? $('[data-s08-stage-select]') : $(`[data-s08-stage="${lesson.stages[index].id}"]`)).focus();
  }
  for (const type of ['prev', 'mobile-prev']) $(`[data-s08-${type}]`).addEventListener('click', () => moveStep(-1));
  for (const type of ['next', 'mobile-next']) $(`[data-s08-${type}]`).addEventListener('click', () => moveStep(1));
  $('[data-s08-stages]').addEventListener('keydown', event => {
    const currentButton = event.target.closest('[data-s08-stage]');
    if (currentButton && ['Enter', ' '].includes(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey) { event.preventDefault(); currentButton.click(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    const buttons = [...root.querySelectorAll('[data-s08-stage]')], current = buttons.indexOf(doc.activeElement); if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1)));
    buttons[next].focus();
  });
  $('[data-s08-zoom]').addEventListener('click', () => { zoom = !zoom; zoomManual = true; render(); });
  mobile?.addEventListener('change', event => { if (!zoomManual) zoom = event.matches; render(); });
  $('[data-s08-copy]').addEventListener('click', async () => {
    const generation = copyGeneration, request = ++copyRequest, copyText = lesson.stages[index].code;
    const isCurrent = () => generation === copyGeneration && request === copyRequest;
    try { await win.navigator.clipboard.writeText(copyText); if (isCurrent()) $('[data-s08-copy-status]').textContent = '코드를 복사했습니다.'; }
    catch { if (!isCurrent()) return; const range = doc.createRange(); range.selectNodeContents($('[data-s08-code]')); const selection = win.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('[data-s08-copy-status]').textContent = '코드를 선택했습니다. 복사 키를 눌러 주세요.'; }
  });
  win.addEventListener('popstate', () => {
    const record = win.history.state?.[key];
    if (record) restore(record);
    else save(); // 원문 앵커의 새 history 항목에는 현재 장면을 이어 둔다.
    revealSource();
  });
  restore(win.history.state?.[key]);
}
if (typeof document !== 'undefined') initS08Learning(document, window);
