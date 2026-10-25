export function initCoreLearning(doc = document, win = window) {
  const root = doc.querySelector('[data-core-learning]');
  if (!root || root.dataset.ready) return;
  const payload = root.querySelector('[data-core-payload]');
  if (!payload) return;
  const data = JSON.parse(payload.textContent);
  if (!Array.isArray(data.units) || !data.units.length) return;
  root.dataset.ready = 'true';
  const $ = name => root.querySelector(`[data-core-${name}]`);
  const element = (tag, text) => { const node = doc.createElement(tag); node.textContent = text; return node; };
  let unit, index = 0, generation = 0, request = 0;
  const readLocation = () => {
    const url = new URL(win.location.href);
    unit = data.units.find(item => item.id === url.searchParams.get('unit')) || data.units[0];
    const step = Number(url.searchParams.get('step') || 1);
    index = Number.isInteger(step) && step >= 1 && step <= unit.stages.length ? step - 1 : 0;
  };
  const save = push => {
    const url = new URL(win.location.href);
    url.searchParams.set('unit', unit.id); url.searchParams.set('step', String(index + 1));
    const previous = win.history.state;
    const state = previous && typeof previous === 'object' && !Array.isArray(previous) ? previous : {};
    win.history[push ? 'pushState' : 'replaceState']({ ...state, __jxConceptCore: { unit: unit.id, step: index + 1 } }, '', url);
  };
  const link = (title, href) => { const node = element('a', title); node.href = href; return node; };
  function render() {
    generation++;
    const stage = unit.stages[index];
    $('title').textContent = unit.title;
    $('definition').textContent = unit.definition;
    $('scenario').textContent = unit.scenario;
    $('prerequisites').replaceChildren(...(unit.prerequisites.length ? unit.prerequisites.map(id => {
      const prerequisite = data.units.find(item => item.id === id);
      return link(`${id} ${prerequisite.title}`, `concept-core.html?unit=${id}`);
    }) : [element('span', '선수 단원 없음')]));
    for (const button of root.querySelectorAll('[data-core-unit]')) {
      button.setAttribute('aria-pressed', String(button.dataset.coreUnit === unit.id));
    }
    $('stage-nav').replaceChildren(...unit.stages.map((item, step) => {
      const button = element('button', `${step + 1}. ${item.title}`);
      button.type = 'button'; button.dataset.coreStep = String(step);
      button.setAttribute('aria-pressed', String(step === index));
      return button;
    }));
    $('stage-title').textContent = stage.title;
    $('stage-description').textContent = stage.explanation;
    $('code').textContent = stage.code;
    const comparisonTitle = root.querySelector('#core-comparison-title');
    if (comparisonTitle) comparisonTitle.textContent = stage.comparisonTitle ?? '상태 비교';
    const defaultColumns = ['대상', '비교 A', '비교 B'];
    const comparisonColumns = stage.columns ?? defaultColumns;
    root.querySelectorAll('.core-comparison thead th').forEach((heading, column) => {
      heading.textContent = comparisonColumns[column] ?? defaultColumns[column] ?? '';
    });
    $('rows').replaceChildren(...stage.rows.map(values => {
      const row = doc.createElement('tr');
      values.forEach((value, n) => { const cell = element(n ? 'td' : 'th', value); if (!n) cell.scope = 'row'; row.append(cell); });
      return row;
    }));
    $('counter').textContent = `${index + 1} / ${unit.stages.length}`;
    $('previous').disabled = index === 0;
    $('next').disabled = index === unit.stages.length - 1;
    $('copy-status').textContent = '';
    $('observations').replaceChildren(...unit.observations.map(({ key, value }) => element('li', `${key}: ${value}`)));
    $('limit').textContent = unit.limit;
    $('sources').replaceChildren(...unit.officialSources.map(source => {
      const row = doc.createElement('li');
      row.append(link(source.section, source.url), element('span', ` — ${source.versionScope}`));
      return row;
    }));
    $('originals').replaceChildren(...unit.sourceLinks.map(source => link(`${source.id} · ${source.heading}`, source.href)));
  }
  function move(step, { focus = false } = {}) {
    if (step < 0 || step >= unit.stages.length) return;
    index = step; render(); save(true);
    if (focus) root.querySelector(`[data-core-step="${index}"]`).focus();
  }
  for (const name of ['previous', 'next']) {
    const control = $(name);
    control.addEventListener('click', () => {
      move(index + (name === 'next' ? 1 : -1));
      if (control.disabled) root.querySelector(`[data-core-step="${index}"]`).focus();
    });
  }
  $('stage-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-core-step]');
    if (button) move(Number(button.dataset.coreStep), { focus: true });
  });
  $('stage-nav').addEventListener('keydown', event => {
    if (!event.target.closest('[data-core-step]')) return;
    const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? unit.stages.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); move(next, { focus: true });
  });
  for (const button of root.querySelectorAll('[data-core-unit]')) button.addEventListener('click', () => {
    unit = data.units.find(item => item.id === button.dataset.coreUnit); index = 0; render(); save(true);
  });
  $('copy').addEventListener('click', async () => {
    const currentGeneration = generation, currentRequest = ++request, text = unit.stages[index].code;
    const isCurrent = () => currentGeneration === generation && currentRequest === request;
    try {
      await win.navigator.clipboard.writeText(text);
      if (isCurrent()) $('copy-status').textContent = '코드를 복사했습니다.';
    } catch {
      if (!isCurrent()) return;
      const selection = win.getSelection?.();
      if (!selection) { $('copy-status').textContent = '코드 영역에서 직접 복사해 주세요.'; return; }
      const range = doc.createRange(); range.selectNodeContents($('code'));
      selection.removeAllRanges(); selection.addRange(range);
      $('copy-status').textContent = '코드를 선택했습니다. 복사 키를 눌러 주세요.';
    }
  });
  const back = $('back');
  if (back && doc.referrer) {
    const referrer = new URL(doc.referrer), expected = new URL('../docs/knowledge/README.html', win.location.href);
    if (referrer.origin === expected.origin && referrer.pathname === expected.pathname) back.href = referrer.href;
  }
  win.addEventListener('popstate', () => { readLocation(); render(); });
  readLocation(); render(); save(false);
}

if (typeof document !== 'undefined') initCoreLearning();
