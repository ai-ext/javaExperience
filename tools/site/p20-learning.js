import { P20_LESSONS, P20_ASSETS, p20AssetRoot, P20_SQL_PHASES } from './p20-lesson-data.mjs';

export function initP20Learning(doc = document, win = window) {
  const root = doc.querySelector('[data-p20-learning]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  function revealSource() {
    let id; try { id = decodeURIComponent(win.location.hash.slice(1)); } catch { return; }
    const original = doc.getElementById('p20-original'), target = doc.getElementById(id);
    if (!original || !target || (target !== original && !original.contains(target))) return;
    let details = target.closest('details');
    while (details && (details === original || original.contains(details))) { details.open = true; details = details.parentElement?.closest('details'); }
  }
  root.querySelector('a[href="#p20-original"]')?.addEventListener('click', () => { const original = doc.getElementById('p20-original'); if (original) original.open = true; });
  win.addEventListener('hashchange', revealSource);
  revealSource();
  const available = P20_LESSONS.filter(lesson => lesson.stages.every(stage => P20_ASSETS[stage.image]?.ready === true));
  if (!available.length) return;
  const $ = selector => root.querySelector(selector);
  const key = '__javaExperienceP20', mobile = win.matchMedia?.('(max-width:700px)');
  let lesson = available[0], index = 0, zoom = mobile?.matches === true, zoomManual = false;
  let copyGeneration = 0, copyRequest = 0;
  const element = (tag, text) => { const node = doc.createElement(tag); node.textContent = text; return node; };
  function save() {
    try { win.history.replaceState({ ...win.history.state, [key]: { topic: lesson.id, stage: lesson.stages[index].id } }, ''); }
    catch { /* history를 쓸 수 없어도 현재 학습 장면은 계속 조작할 수 있다. */ }
  }
  function renderStages() {
    $('[data-p20-stage-select]').replaceChildren(...lesson.stages.map((stage, i) => { const option = element('option', `${i + 1}/${lesson.stages.length} · ${stage.title}`); option.value = stage.id; return option; }));
    $('[data-p20-stages]').replaceChildren(...lesson.stages.map((stage, i) => {
      const button = element('button', stage.title); button.type = 'button'; button.dataset.p20Stage = stage.id;
      button.addEventListener('click', () => { index = i; render(); save(); }); return button;
    }));
  }
  function render() {
    copyGeneration++;
    const stage = lesson.stages[index], asset = P20_ASSETS[stage.image];
    root.dataset.topic = lesson.id; root.dataset.stage = stage.id;
    $('[data-p20-topic]').value = lesson.id;
    for (const [field, value] of [['question', lesson.question], ['source', lesson.source], ['title', stage.title], ['lead', stage.lead], ['note', stage.note || lesson.note]]) $(`[data-p20-${field}]`).textContent = value;
    const img = $('[data-p20-image]'); img.src = p20AssetRoot + asset.file; img.alt = asset.alt + ' · 현재 설명: ' + stage.title; img.width = asset.width; img.height = asset.height;
    $('[data-p20-image-link]').href = img.getAttribute('src');
    const focus = asset.focus?.[stage.id], overlay = $('[data-p20-focus]'), zoomed = zoom && Boolean(focus);
    overlay.hidden = !focus || zoomed;
    if (focus) for (const [property, value] of Object.entries({ left: focus[0], top: focus[1], width: focus[2], height: focus[3] })) overlay.style[property] = value + '%';
    const frame = $('.p20-image-frame'), imageWindow = $('.p09-image-window'); frame.dataset.zoom = String(zoomed);
    const ratio = zoomed ? String(asset.width * focus[2] / (asset.height * focus[3])) : '';
    frame.style.aspectRatio = ratio; imageWindow.style.aspectRatio = ratio;
    imageWindow.style.setProperty('--p09-mobile-crop-width', zoomed ? `${asset.width * .85 * focus[2] / 100}px` : '100%'); frame.scrollLeft = 0;
    if (zoomed && mobile?.matches) { frame.tabIndex = 0; frame.setAttribute('aria-label', '확대한 그림 · 좌우로 이동해 읽기'); }
    else { frame.removeAttribute('tabindex'); frame.removeAttribute('aria-label'); }
    img.style.width = zoomed ? 10000 / focus[2] + '%' : '100%'; img.style.transform = zoomed ? `translate(-${focus[0]}%, -${focus[1]}%)` : 'none';
    $('[data-p20-zoom]').hidden = !focus; $('[data-p20-zoom]').setAttribute('aria-pressed', String(zoomed)); $('[data-p20-zoom]').textContent = zoomed ? '전체 그림 보기' : '강조 구간 확대';
    $('[data-p20-figure-label]').textContent = zoomed ? (mobile?.matches ? '현재 구간 확대 · 그림을 좌우로 밀어 읽어요' : '현재 강조 구간을 확대한 그림') : '전체 관계 그림 · 현재 값은 아래에서 확인해요';
    $('[data-p20-state]').replaceChildren(...stage.values.flatMap(([label, value]) => [element('dt', label), element('dd', value)]));
    const code = $('[data-p20-code]'); code.replaceChildren();
    stage.code.split('\n').forEach((line, i, lines) => { code.append(element(stage.active.includes(i) ? 'mark' : 'span', line || ' ')); if (i < lines.length - 1) code.append(doc.createTextNode('\n')); });
    $('[data-p20-copy-status]').textContent = '';
    const output = $('[data-p20-output]'); output.hidden = !(stage.checks.length || stage.sqlPhases.length);
    if (output.dataset.stage !== stage.id) output.open = false;
    output.dataset.stage = stage.id;
    $('[data-p20-stdout]').textContent = stage.checks.map(check => 'PASS ' + check).join('\n');
    $('[data-p20-stdout]').parentElement.hidden = !stage.checks.length;
    const sql = $('[data-p20-sql]'); sql.replaceChildren();
    for (const phase of stage.sqlPhases) {
      const statements = P20_SQL_PHASES[phase];
      sql.append(element('h4', phase + ' · 바인딩값 미기록'));
      if (!statements.length) sql.append(element('p', '이 구간에서 기록한 SQL 없음'));
      statements.forEach((statement, i) => {
        const pre = element('pre', ''); pre.append(element('code', statement));
        sql.append(element('h5', phase + '[' + i + ']'), pre);
      });
    }
    for (const type of ['prev', 'mobile-prev']) $(`[data-p20-${type}]`).disabled = index === 0;
    for (const type of ['next', 'mobile-next']) $(`[data-p20-${type}]`).disabled = index === lesson.stages.length - 1;
    $('[data-p20-position]').textContent = `${index + 1} / ${lesson.stages.length}`;
    $('[data-p20-stage-select]').value = stage.id;
    root.querySelectorAll('[data-p20-stage]').forEach(button => { if (button.dataset.p20Stage === stage.id) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
  }
  function restore(record) {
    lesson = available.find(item => item.id === record?.topic) || available[0];
    const next = lesson.stages.findIndex(stage => stage.id === record?.stage); index = next < 0 ? 0 : next;
    renderStages(); render();
  }
  $('[data-p20-topic]').addEventListener('change', event => { restore({ topic: event.target.value }); save(); });
  $('[data-p20-stage-select]').addEventListener('change', event => { const next = lesson.stages.findIndex(stage => stage.id === event.target.value); if (next >= 0) { index = next; render(); save(); } });
  function moveStep(delta) {
    const next = Math.max(0, Math.min(lesson.stages.length - 1, index + delta)); if (next === index) return;
    const focused = doc.activeElement; index = next; render(); save();
    if (focused?.disabled) (mobile?.matches ? $('[data-p20-stage-select]') : $(`[data-p20-stage="${lesson.stages[index].id}"]`)).focus();
  }
  for (const type of ['prev', 'mobile-prev']) $(`[data-p20-${type}]`).addEventListener('click', () => moveStep(-1));
  for (const type of ['next', 'mobile-next']) $(`[data-p20-${type}]`).addEventListener('click', () => moveStep(1));
  $('[data-p20-stages]').addEventListener('keydown', event => {
    const currentButton = event.target.closest('[data-p20-stage]');
    if (currentButton && ['Enter', ' '].includes(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey) { event.preventDefault(); currentButton.click(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    const buttons = [...root.querySelectorAll('[data-p20-stage]')], current = buttons.indexOf(doc.activeElement); if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1)));
    buttons[next].focus();
  });
  $('[data-p20-zoom]').addEventListener('click', () => { zoom = !zoom; zoomManual = true; render(); });
  mobile?.addEventListener('change', event => { if (!zoomManual) zoom = event.matches; render(); });
  $('[data-p20-copy]').addEventListener('click', async () => {
    const generation = copyGeneration, request = ++copyRequest, copyText = lesson.stages[index].code;
    const isCurrent = () => generation === copyGeneration && request === copyRequest;
    try { await win.navigator.clipboard.writeText(copyText); if (isCurrent()) $('[data-p20-copy-status]').textContent = '코드를 복사했습니다.'; }
    catch { if (!isCurrent()) return; const range = doc.createRange(); range.selectNodeContents($('[data-p20-code]')); const selection = win.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('[data-p20-copy-status]').textContent = '코드를 선택했습니다. 복사 키를 눌러 주세요.'; }
  });
  win.addEventListener('popstate', () => {
    const record = win.history.state?.[key];
    if (record) restore(record);
    else save(); // 원문 앵커의 새 history 항목에는 현재 장면을 이어 둔다.
    revealSource();
  });
  restore(win.history.state?.[key]);
}
if (typeof document !== 'undefined') initP20Learning(document, window);
