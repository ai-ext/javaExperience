import { P04_LESSONS, P04_ASSETS, p04AssetRoot } from './p04-lesson-data.mjs';

export function initP04Learning(doc = document, win = window) {
  const root = doc.querySelector('[data-p04-learning]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  doc.body.classList.add('knowledge-detail-page');
  const $ = selector => root.querySelector(selector);
  function revealSource() {
    let id; try { id = decodeURIComponent(win.location.hash.slice(1)); } catch { return; }
    let details = doc.getElementById(id)?.closest('details');
    while (details) { details.open = true; details = details.parentElement?.closest('details'); }
  }
  root.querySelector('a[href="#p04-original"]')?.addEventListener('click', () => { const original = doc.getElementById('p04-original'); if (original) original.open = true; });
  win.addEventListener('hashchange', revealSource);
  revealSource();
  const available = P04_LESSONS.filter(lesson => lesson.stages.every(stage => P04_ASSETS[stage.image]?.ready === true));
  if (!available.length) return;
  const key = '__javaExperienceP04', mobile = win.matchMedia?.('(max-width:700px)');
  let lesson = available[0], index = 0, zoom = mobile?.matches === true, zoomManual = false;
  const element = (name, text) => { const node = doc.createElement(name); node.textContent = text; return node; };
  function save() {
    try { win.history.replaceState({ ...win.history.state, [key]: { topic: lesson.id, stage: lesson.stages[index].id } }, ''); }
    catch { /* history를 쓸 수 없어도 현재 장면은 계속 조작할 수 있다. */ }
  }
  function renderStages() {
    $('[data-p04-stage-select]').replaceChildren(...lesson.stages.map((stage, i) => { const option = element('option', `${i + 1}/${lesson.stages.length} · ${stage.title}`); option.value = stage.id; return option; }));
    $('[data-p04-stages]').replaceChildren(...lesson.stages.map((stage, i) => {
      const button = element('button', stage.title); button.type = 'button'; button.dataset.p04Stage = stage.id;
      button.addEventListener('click', () => { index = i; render(); save(); }); return button;
    }));
  }
  function render() {
    const stage = lesson.stages[index], asset = P04_ASSETS[stage.image];
    const initMobile=lesson.id==='initialization'&&mobile?.matches;
    const holder=$('[data-p04-init-mobile]');holder.hidden=!initMobile;holder.replaceChildren();
    if(initMobile){
      holder.append(element('h4','한 Child 객체'));
      for(const field of ['Parent.marker','Child.marker']){
        const row=element('div');row.className='p04-init-field';
        row.append(element('code',field),element('strong',stage.values.find(([label])=>label===field)[1]));holder.append(row);
      }
      holder.append(element('p',`${index+1}/7 · 해당 초기화 동작 완료 뒤`));
    }
    $('.p09-value-sheet').hidden=Boolean(initMobile);

    root.dataset.topic = lesson.id; root.dataset.stage = stage.id;
    $('[data-p04-topic]').value = lesson.id;
    for (const [field, value] of [['question', lesson.question], ['source', lesson.source], ['title', stage.title], ['lead', stage.lead], ['note', stage.note || lesson.note]]) $(`[data-p04-${field}]`).textContent = value;
    const img = $('[data-p04-image]'); img.src = p04AssetRoot + asset.file; img.alt = asset.alt + ' · 현재 설명: ' + stage.title; img.width = asset.width; img.height = asset.height;
    $('[data-p04-image-link]').href = img.getAttribute('src');
    const focus = asset.focus?.[stage.id], overlay = $('[data-p04-focus]'), zoomed = zoom && Boolean(focus);
    overlay.hidden = !focus || zoomed;
    if (focus) for (const [property, value] of Object.entries({ left: focus[0], top: focus[1], width: focus[2], height: focus[3] })) overlay.style[property] = value + '%';
    const frame = $('.p09-image-frame'), imageWindow = $('.p09-image-window'); frame.dataset.zoom = String(zoomed); frame.hidden=Boolean(initMobile);
    const ratio = zoomed ? String(asset.width * focus[2] / (asset.height * focus[3])) : '';
    frame.style.aspectRatio = ratio; imageWindow.style.aspectRatio = ratio;
    imageWindow.style.setProperty('--p09-mobile-crop-width', zoomed ? `${asset.width * .85 * focus[2] / 100}px` : '100%'); frame.scrollLeft = 0;
    if (zoomed && mobile?.matches) { frame.tabIndex = 0; frame.setAttribute('aria-label', '확대한 그림 · 좌우로 이동해 읽기'); }
    else { frame.removeAttribute('tabindex'); frame.removeAttribute('aria-label'); }
    img.style.width = zoomed ? 10000 / focus[2] + '%' : '100%'; img.style.transform = zoomed ? `translate(-${focus[0]}%, -${focus[1]}%)` : 'none';
    $('[data-p04-zoom]').hidden = !focus||Boolean(initMobile); $('[data-p04-zoom]').setAttribute('aria-pressed', String(zoomed)); $('[data-p04-zoom]').textContent = zoomed ? '전체 그림 보기' : '강조 구간 확대';
    $('[data-p04-figure-label]').textContent = initMobile ? '같은 두 필드를 모바일에 맞춰 배치했어요' : zoomed ? (mobile?.matches ? '현재 구간 확대 · 그림을 좌우로 밀어 읽어요' : '현재 강조 구간을 확대한 그림') : '전체 관계 그림 · 현재 값은 아래에서 확인해요';
    $('[data-p04-state]').replaceChildren(...stage.values.flatMap(([label, value]) => [element('dt', label), element('dd', value)]));
    $('[data-p04-snapshot]').hidden = !stage.snapshot; $('[data-p04-snapshot]').textContent = stage.snapshot || '';
    const code = $('[data-p04-code]'); code.replaceChildren();
    stage.code.split('\n').forEach((line, i, lines) => { code.append(element(stage.active.includes(i) ? 'mark' : 'span', line || ' ')); if (i < lines.length - 1) code.append(doc.createTextNode('\n')); });
    $('[data-p04-copy-status]').textContent = '';
    $('[data-p04-output]').hidden = !stage.stdout; $('[data-p04-stdout]').textContent = stage.stdout;
    const output=$('[data-p04-output]'), verificationOnly=stage.outputLabel?.startsWith('추가 실험 검증 출력')===true;
    const outputKey=lesson.id+'/'+stage.id;
    if(output.dataset.stage!==outputKey)output.open=!verificationOnly;
    output.dataset.stage=outputKey;
    $('[data-p04-output-title]').textContent = verificationOnly?'추가 실행 검증 보기':stage.outputLabel || (lesson.id === 'initialization' ? '여기까지의 출력 · 원문 7줄 중' : '이 호출의 출력');
    $('[data-p04-output-note]').hidden=!verificationOnly;
    $('[data-p04-output-note]').textContent=stage.outputLabel||'';
    for (const type of ['prev', 'mobile-prev']) $(`[data-p04-${type}]`).disabled = index === 0;
    for (const type of ['next', 'mobile-next']) $(`[data-p04-${type}]`).disabled = index === lesson.stages.length - 1;
    $('[data-p04-position]').textContent = `${index + 1} / ${lesson.stages.length}`;
    $('[data-p04-stage-select]').value = stage.id;
    root.querySelectorAll('[data-p04-stage]').forEach(button => { if (button.dataset.p04Stage === stage.id) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
  }
  function restore(record) {
    lesson = available.find(item => item.id === record?.topic) || available[0];
    const found = lesson.stages.findIndex(stage => stage.id === record?.stage); index = found < 0 ? 0 : found;
    renderStages(); render();
  }
  $('[data-p04-topic]').addEventListener('change', event => { restore({ topic: event.target.value }); save(); });
  $('[data-p04-stage-select]').addEventListener('change', event => { const next = lesson.stages.findIndex(stage => stage.id === event.target.value); if (next >= 0) { index = next; render(); save(); } });
  function moveStep(delta) {
    const next = Math.max(0, Math.min(lesson.stages.length - 1, index + delta)); if (next === index) return;
    const focused = doc.activeElement; index = next; render(); save();
    if (focused?.disabled) (mobile?.matches ? $('[data-p04-stage-select]') : $(`[data-p04-stage="${lesson.stages[index].id}"]`)).focus();
  }
  for (const type of ['prev', 'mobile-prev']) $(`[data-p04-${type}]`).addEventListener('click', () => moveStep(-1));
  for (const type of ['next', 'mobile-next']) $(`[data-p04-${type}]`).addEventListener('click', () => moveStep(1));
  $('[data-p04-stages]').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...root.querySelectorAll('[data-p04-stage]')], current = buttons.indexOf(doc.activeElement); if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1)));
    buttons[next].focus();
  });
  $('[data-p04-zoom]').addEventListener('click', () => { zoom = !zoom; zoomManual = true; render(); });
  mobile?.addEventListener('change', event => { if (!zoomManual) zoom = event.matches; render(); });
  $('[data-p04-copy]').addEventListener('click', async () => {
    try { await win.navigator.clipboard.writeText(lesson.stages[index].code); $('[data-p04-copy-status]').textContent = '코드를 복사했습니다.'; }
    catch { const range = doc.createRange(); range.selectNodeContents($('[data-p04-code]')); const selection = win.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('[data-p04-copy-status]').textContent = '코드를 선택했습니다. 복사 키를 눌러 주세요.'; }
  });
  win.addEventListener('popstate', () => {
    const record = win.history.state?.[key];
    if (record) restore(record);
    else save(); // 원문 앵커의 새 history 항목에는 현재 장면을 이어 둔다.
    revealSource();
  });
  restore(win.history.state?.[key]);
}
if (typeof document !== 'undefined') initP04Learning(document, window);
