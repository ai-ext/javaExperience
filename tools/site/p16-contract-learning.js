import { P16_CONTRACT_LESSONS, P16_CONTRACT_ASSETS, p16ContractAssetRoot } from './p16-contract-data.mjs';

export function initP16ContractLearning(doc = document, win = window) {
  const root = doc.querySelector('[data-p16-contract-learning]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const available = P16_CONTRACT_LESSONS.filter(lesson => lesson.stages.every(stage => P16_CONTRACT_ASSETS[stage.image]?.ready === true));
  if (!available.length) return;
  const $ = selector => root.querySelector(selector);
  const key = '__javaExperienceP16Contract', mobile = win.matchMedia?.('(max-width:700px)');
  let lesson = available[0], index = 0, zoom = mobile?.matches === true, zoomManual = false;
  let copyGeneration = 0, copyRequest = 0;
  const element = (tag, text) => { const node = doc.createElement(tag); node.textContent = text; return node; };
  function save() {
    try { win.history.replaceState({ ...win.history.state, [key]: { topic: lesson.id, stage: lesson.stages[index].id } }, ''); }
    catch { /* history를 쓸 수 없어도 현재 보충 장면은 계속 조작할 수 있다. */ }
  }
  function renderStages() {
    $('[data-p16-contract-stage-select]').replaceChildren(...lesson.stages.map((stage, i) => { const option = element('option', `${i + 1}/${lesson.stages.length} · ${stage.title}`); option.value = stage.id; return option; }));
    $('[data-p16-contract-stages]').replaceChildren(...lesson.stages.map((stage, i) => {
      const button = element('button', stage.title); button.type = 'button'; button.dataset.p16ContractStage = stage.id;
      button.addEventListener('click', () => { index = i; render(); save(); }); return button;
    }));
  }
  function render() {
    copyGeneration++;
    const stage = lesson.stages[index], asset = P16_CONTRACT_ASSETS[stage.image];
    root.dataset.topic = lesson.id; root.dataset.stage = stage.id;
    $('[data-p16-contract-topic]').value = lesson.id;
    for (const [field, value] of [['question', lesson.question], ['source', lesson.source], ['title', stage.title], ['lead', stage.lead], ['note', stage.note || lesson.note]]) $(`[data-p16-contract-${field}]`).textContent = value;
    const img = $('[data-p16-contract-image]'); img.src = p16ContractAssetRoot + asset.file; img.alt = asset.alt + ' · 현재 설명: ' + stage.title; img.width = asset.width; img.height = asset.height;
    $('[data-p16-contract-image-link]').href = img.getAttribute('src');
    const focus = asset.focus?.[stage.id], overlay = $('[data-p16-contract-focus]'), zoomed = zoom && Boolean(focus);
    overlay.hidden = !focus || zoomed;
    if (focus) for (const [property, value] of Object.entries({ left: focus[0], top: focus[1], width: focus[2], height: focus[3] })) overlay.style[property] = value + '%';
    const frame = $('.p16-contract-image-frame'), imageWindow = $('.p09-image-window'); frame.dataset.zoom = String(zoomed);
    const ratio = zoomed ? String(asset.width * focus[2] / (asset.height * focus[3])) : '';
    frame.style.aspectRatio = ratio; imageWindow.style.aspectRatio = ratio;
    imageWindow.style.setProperty('--p09-mobile-crop-width', zoomed ? `${asset.width * .85 * focus[2] / 100}px` : '100%'); frame.scrollLeft = 0;
    if (zoomed && mobile?.matches) { frame.tabIndex = 0; frame.setAttribute('aria-label', '확대한 그림 · 좌우로 이동해 읽기'); }
    else { frame.removeAttribute('tabindex'); frame.removeAttribute('aria-label'); }
    img.style.width = zoomed ? 10000 / focus[2] + '%' : '100%'; img.style.transform = zoomed ? `translate(-${focus[0]}%, -${focus[1]}%)` : 'none';
    $('[data-p16-contract-zoom]').hidden = !focus; $('[data-p16-contract-zoom]').setAttribute('aria-pressed', String(zoomed)); $('[data-p16-contract-zoom]').textContent = zoomed ? '전체 그림 보기' : '강조 구간 확대';
    $('[data-p16-contract-figure-label]').textContent = zoomed ? (mobile?.matches ? '현재 구간 확대 · 그림을 좌우로 밀어 읽어요' : '현재 강조 구간을 확대한 그림') : '전체 관계 그림 · 현재 값은 아래에서 확인해요';
    $('[data-p16-contract-state]').replaceChildren(...stage.values.flatMap(([label, value]) => [element('dt', label), element('dd', value)]));
    const code = $('[data-p16-contract-code]'); code.replaceChildren();
    stage.code.split('\n').forEach((line, i, lines) => { code.append(element(stage.active.includes(i) ? 'mark' : 'span', line || ' ')); if (i < lines.length - 1) code.append(doc.createTextNode('\n')); });
    $('[data-p16-contract-copy-status]').textContent = '';
    const output = $('[data-p16-contract-output]'); output.hidden = !stage.checks.length;
    if (output.dataset.stage !== stage.id) output.open = false;
    output.dataset.stage = stage.id;
    $('[data-p16-contract-stdout]').textContent = stage.checks.map(check => 'PASS ' + check).join('\n');
    for (const type of ['prev', 'mobile-prev']) $(`[data-p16-contract-${type}]`).disabled = index === 0;
    for (const type of ['next', 'mobile-next']) $(`[data-p16-contract-${type}]`).disabled = index === lesson.stages.length - 1;
    $('[data-p16-contract-position]').textContent = `${index + 1} / ${lesson.stages.length}`;
    $('[data-p16-contract-stage-select]').value = stage.id;
    root.querySelectorAll('[data-p16-contract-stage]').forEach(button => { if (button.dataset.p16ContractStage === stage.id) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
  }
  function restore(record) {
    lesson = available.find(item => item.id === record?.topic) || available[0];
    const next = lesson.stages.findIndex(stage => stage.id === record?.stage); index = next < 0 ? 0 : next;
    renderStages(); render();
  }
  $('[data-p16-contract-topic]').addEventListener('change', event => { restore({ topic: event.target.value }); save(); });
  $('[data-p16-contract-stage-select]').addEventListener('change', event => { const next = lesson.stages.findIndex(stage => stage.id === event.target.value); if (next >= 0) { index = next; render(); save(); } });
  function moveStep(delta) {
    const next = Math.max(0, Math.min(lesson.stages.length - 1, index + delta)); if (next === index) return;
    const focused = doc.activeElement; index = next; render(); save();
    if (focused?.disabled) (mobile?.matches ? $('[data-p16-contract-stage-select]') : $(`[data-p16-contract-stage="${lesson.stages[index].id}"]`)).focus();
  }
  for (const type of ['prev', 'mobile-prev']) $(`[data-p16-contract-${type}]`).addEventListener('click', () => moveStep(-1));
  for (const type of ['next', 'mobile-next']) $(`[data-p16-contract-${type}]`).addEventListener('click', () => moveStep(1));
  $('[data-p16-contract-stages]').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    const buttons = [...root.querySelectorAll('[data-p16-contract-stage]')], current = buttons.indexOf(doc.activeElement); if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1)));
    buttons[next].focus();
  });
  $('[data-p16-contract-zoom]').addEventListener('click', () => { zoom = !zoom; zoomManual = true; render(); });
  mobile?.addEventListener('change', event => { if (!zoomManual) zoom = event.matches; render(); });
  $('[data-p16-contract-copy]').addEventListener('click', async () => {
    const generation = copyGeneration, request = ++copyRequest, copyText = lesson.stages[index].code;
    const isCurrent = () => generation === copyGeneration && request === copyRequest;
    try { await win.navigator.clipboard.writeText(copyText); if (isCurrent()) $('[data-p16-contract-copy-status]').textContent = '코드를 복사했습니다.'; }
    catch { if (!isCurrent()) return; const range = doc.createRange(); range.selectNodeContents($('[data-p16-contract-code]')); const selection = win.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('[data-p16-contract-copy-status]').textContent = '코드를 선택했습니다. 복사 키를 눌러 주세요.'; }
  });
  win.addEventListener('popstate', () => {
    const record = win.history.state?.[key];
    if (record) restore(record);
    else save(); // 원문 앵커의 새 history 항목에는 현재 장면을 이어 둔다.
  });
  restore(win.history.state?.[key]);
}
if (typeof document !== 'undefined') initP16ContractLearning(document, window);
