const initialized = new WeakSet();

export function initD12Learning(doc = document, win = window) {
  const root = doc.querySelector('[data-d12-learning]');
  if (!root || initialized.has(root)) return;
  let data;
  try { data = JSON.parse(root.querySelector('[data-d12-data]')?.textContent || '{}'); }
  catch { return; }
  const { lessons, assets = {}, assetRoot = '' } = data;
  if (!lessons?.length) return;
  initialized.add(root);
  const $ = selector => root.querySelector(selector);
  const key = '__javaExperienceD12';
  const element = (tag, value) => { const node = doc.createElement(tag); node.textContent = value ?? ''; return node; };
  let lesson = lessons[0], index = 0, zoom = false, generation = 0, copyRequestId = 0;

  function revealOriginal() {
    let id;
    try { id = decodeURIComponent(win.location.hash.slice(1)); } catch { return; }
    const original = doc.getElementById('d12-original'), target = doc.getElementById(id);
    if (!original || !target || (target !== original && !original.contains(target))) return;
    let details = target.closest('details');
    while (details) { details.open = true; details = details.parentElement?.closest('details'); }
  }
  function updateUrl() {
    try {
      const url = new URL(win.location.href);
      url.searchParams.set('topic', lesson.id);
      url.searchParams.set('stage', lesson.stages[index].id);
      win.history.replaceState({ ...win.history.state, [key]: { topic: lesson.id, stage: lesson.stages[index].id } }, '', url);
    } catch { /* URL이나 history를 갱신하지 못해도 화면은 계속 동작한다. */ }
  }
  function controls() {
    $('[data-d12-stages]').replaceChildren(...lesson.stages.map(stage => {
      const button = element('button', stage.title);
      button.type = 'button'; button.dataset.d12Stage = stage.id;
      button.addEventListener('click', () => selectStage(stage.id));
      return button;
    }));
  }
  function selectStage(id, save = true) {
    const next = lesson.stages.findIndex(stage => stage.id === id);
    if (next < 0) return;
    index = next; zoom = false; render();
    if (save) updateUrl();
  }
  function codeLabel(stage) {
    const labels = {
      'native-linux': '실제 Linux 격리 fixture · 실제 실행 인자',
      'native-docker': '별도 idle Docker 컨테이너의 실제 관측 명령',
      'additional-linux-bash': '추가 Linux · Bash 실제 관측 · 실제 argv[-1]',
      'additional-linux-python': '추가 Linux 실제 Python fixture 코드',
      'additional-linux-python-probe': '추가 Linux 실제 Python 권한 probe',
      'additional-linux-argv-json': '실제 실행 argv(JSON) · 복사값은 명령 예시 아님',
      'original-bash-unrun': '원문 Bash 예시 · 미실행',
      'original-ini-unrun': '원문 INI unit · 미실행',
      'original-prose': '원문 산문 · 실행 코드 아님',
      'explanatory-model': '설명 모델 · 명령 실행 결과 아님',
    };
    return labels[stage.codeKind] || '추가 Linux fixture의 Python 코드 · 원문 예시와 구분';
  }
  function render() {
    generation += 1;
    const stage = lesson.stages[index], asset = stage.image ? assets[stage.image] : null;
    root.dataset.topic = lesson.id; root.dataset.stage = stage.id;
    $('[data-d12-topic]').value = lesson.id;
    for (const [name, value] of [['question', lesson.question], ['source', lesson.source], ['title', stage.title], ['lead', stage.lead], ['note', stage.note || lesson.note]]) {
      $(`[data-d12-${name}]`).textContent = value || '';
    }
    const imageFrame = $('[data-d12-image-frame]'), imagePending = $('[data-d12-image-pending]');
    const focus = asset?.focus?.[stage.id];
    if (asset) {
      const image = $('[data-d12-image]');
      image.src = assetRoot + asset.file; image.width = asset.width; image.height = asset.height;
      image.alt = `${asset.alt || ''}${stage.title ? ` · ${stage.title}` : ''}`;
      imageFrame.hidden = false; imagePending.hidden = true;
      const link = $('[data-d12-image-link]'); link.href = image.src; link.hidden = false;
    } else {
      imageFrame.hidden = true; imagePending.hidden = false;
      $('[data-d12-image-link]').hidden = true;
    }
    const frame = $('.d12-image-frame'), windowNode = root.querySelector('.p09-image-window'), overlay = $('[data-d12-focus]');
    const zoomed = zoom && Boolean(focus);
    overlay.hidden = !focus || zoomed;
    if (focus) for (const [prop, value] of Object.entries({ left: focus[0], top: focus[1], width: focus[2], height: focus[3] })) overlay.style[prop] = `${value}%`;
    frame.dataset.zoom = String(zoomed);
    const ratio = zoomed ? asset.width * focus[2] / (asset.height * focus[3]) : 0;
    frame.style.aspectRatio = zoomed ? String(ratio) : '';
    windowNode.style.aspectRatio = zoomed ? String(ratio) : '';
    frame.style.setProperty('--d12-zoom-width', zoomed ? `${540 * ratio}px` : '100%');
    const image = $('[data-d12-image]');
    image.style.width = zoomed ? `${10000 / focus[2]}%` : '100%';
    image.style.transform = zoomed ? `translate(-${focus[0]}%, -${focus[1]}%)` : 'none';
    $('[data-d12-zoom]').hidden = !focus;
    $('[data-d12-zoom]').setAttribute('aria-pressed', String(zoomed));
    $('[data-d12-zoom]').textContent = zoomed ? '전체 그림 보기' : '강조 구간 확대';
    $('[data-d12-figure-label]').textContent = zoomed ? '현재 구간 확대' : '상태에 연결된 그림';

    const values = Array.isArray(stage.values) ? stage.values : [];
    $('[data-d12-state]').replaceChildren(...values.flatMap(([label, value]) => [element('dt', label), element('dd', value)]));
    $('[data-d12-evidence-kind]').textContent = stage.evidenceKind || '';
    $('[data-d12-pending]').hidden = Boolean(values.length && stage.code);
    const code = $('[data-d12-code]'); code.replaceChildren();
    const payload = typeof stage.code === 'string' ? stage.code : '';
    const isProse = stage.codeKind === 'original-prose';
    $('[data-d12-code-frame]').hidden = isProse;
    $('[data-d12-prose]').hidden = !isProse;
    $('[data-d12-prose]').textContent = isProse ? payload : '';
    $('[data-d12-code-heading]').textContent = isProse ? '원문 산문과 설명' : '함께 읽을 코드·설명';
    $('[data-d12-copy]').textContent = isProse ? '현재 산문 복사' : '현재 코드 복사';
    payload.split('\n').forEach((line, i, all) => {
      const mark = stage.active?.includes(i);
      code.append(element(mark ? 'mark' : 'span', line));
      if (i < all.length - 1) code.append(doc.createTextNode('\n'));
    });
    $('[data-d12-copy]').disabled = !payload;
    $('[data-d12-code-kind]').textContent = payload ? codeLabel(stage) : '';
    $('[data-d12-copy-status]').textContent = '';

    const details = $('[data-d12-source-details]');
    const fragments = stage.sourceFragments || [];
    details.hidden = !fragments.length && !stage.evidence && !stage.fullEvidence && !stage.evidencePath;
    if (details.dataset.stage !== stage.id) details.open = false;
    details.dataset.stage = stage.id;
    $('[data-d12-evidence]').textContent = stage.evidence || '';
    const links = $('[data-d12-source-fragments]'); links.replaceChildren(...fragments.map((fragment, i) => {
      const anchor = element('a', `${fragment.path}:${fragment.start}-${fragment.end}`);
      anchor.href = `../../${fragment.path}`; anchor.target = '_blank'; anchor.rel = 'noopener';
      return i ? [element('span', ' · '), anchor] : [anchor];
    }).flat());
    $('[data-d12-source-code]').replaceChildren(...fragments.map(fragment => {
      const section = doc.createElement('section');
      section.append(element('h4', `${fragment.path}:${fragment.start}-${fragment.end}`));
      const pre = doc.createElement('pre'); pre.append(element('code', fragment.content)); section.append(pre);
      return section;
    }));
    const evidenceLink = $('[data-d12-evidence-link]'); evidenceLink.replaceChildren();
    if (stage.evidencePath) {
      const link = element('a', '관측 원자료 JSON 보기');
      link.href = `../../${stage.evidencePath}`; link.target = '_blank'; link.rel = 'noopener'; evidenceLink.append(link);
    }
    const full = $('[data-d12-full-evidence]'); full.hidden = !stage.fullEvidence;
    $('[data-d12-full-evidence-code]').textContent = stage.fullEvidence || '';
    $('[data-d12-prev]').disabled = index === 0;
    $('[data-d12-next]').disabled = index === lesson.stages.length - 1;
    $('[data-d12-position]').textContent = `${index + 1} / ${lesson.stages.length}`;
    root.querySelectorAll('[data-d12-stage]').forEach(button => {
      if (button.dataset.d12Stage === stage.id) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function restore(record = {}) {
    const params = new URLSearchParams(win.location.search);
    lesson = lessons.find(item => item.id === (params.get('topic') || record.topic)) || lessons[0];
    const stageId = params.get('stage') || record.stage;
    index = Math.max(0, lesson.stages.findIndex(item => item.id === stageId));
    controls(); render();
  }
  function move(delta) {
    const target = Math.max(0, Math.min(lesson.stages.length - 1, index + delta));
    if (target === index) return;
    const focused = doc.activeElement;
    index = target; zoom = false; render(); updateUrl();
    if (focused?.disabled) $(`[data-d12-stage="${lesson.stages[index].id}"]`)?.focus();
  }

  $('[data-d12-topic]').addEventListener('change', event => {
    lesson = lessons.find(item => item.id === event.target.value) || lessons[0];
    index = 0; controls(); render(); updateUrl();
  });
  $('[data-d12-prev]').addEventListener('click', () => move(-1));
  $('[data-d12-next]').addEventListener('click', () => move(1));
  $('[data-d12-stages]').addEventListener('keydown', event => {
    const current = [...root.querySelectorAll('[data-d12-stage]')].indexOf(doc.activeElement);
    if (current < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const buttons = [...root.querySelectorAll('[data-d12-stage]')];
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1)));
    buttons[next].focus();
  });
  $('[data-d12-zoom]').addEventListener('click', () => { zoom = !zoom; render(); });
  $('[data-d12-copy]').addEventListener('click', async () => {
    const stage = lesson.stages[index], payload = stage.code;
    if (!payload) return;
    const request = ++copyRequestId, currentGeneration = generation;
    const isProse = stage.codeKind === 'original-prose';
    try {
      await win.navigator.clipboard.writeText(payload);
      if (request === copyRequestId && currentGeneration === generation) $('[data-d12-copy-status]').textContent = isProse ? '현재 산문을 복사했습니다.' : '현재 코드를 복사했습니다.';
    } catch {
      if (request !== copyRequestId || currentGeneration !== generation) return;
      const selectedContent = lesson.stages[index].codeKind === 'original-prose' ? $('[data-d12-prose]') : $('[data-d12-code]');
      const range = doc.createRange(); range.selectNodeContents(selectedContent);
      const selection = win.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      $('[data-d12-copy-status]').textContent = isProse ? '현재 표시된 산문을 선택했습니다. 복사 키를 눌러 주세요.' : '현재 표시된 코드를 선택했습니다. 복사 키를 눌러 주세요.';
    }
  });
  $('[data-d12-original-link]').addEventListener('click', () => {
    const original = doc.getElementById('d12-original'); if (original) original.open = true;
  });
  win.addEventListener('popstate', () => { restore(win.history.state?.[key]); revealOriginal(); });
  win.addEventListener('hashchange', revealOriginal);
  restore(win.history.state?.[key]); revealOriginal();
}

if (typeof document !== 'undefined') initD12Learning(document, window);
