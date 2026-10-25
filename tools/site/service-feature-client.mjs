const PROGRESS_KEY = 'javaexperience.service.progress.v1';

function element(doc, name, text, className) {
  const node = doc.createElement(name);
  if (text != null) node.textContent = String(text);
  if (className) node.className = className;
  return node;
}

function renderContractView(view, recipe) {
  if (!view || !recipe) return;
  const doc = view.ownerDocument;
  view.replaceChildren();
  if (recipe.binding?.key) {
    view.append(element(doc, 'p', `아직 정하지 않은 내 프로젝트 계약 · 원문 ${recipe.binding.sourceId || '출처 미지정'} · 실제 API 값을 직접 입력하세요.`, 'sf-contract-binding'));
  }
  const route = element(doc, 'div', null, 'sf-contract-route');
  route.append(element(doc, 'span', recipe.method || (recipe.binding ? '직접 등록' : '미정'), `sf-method sf-method-${String(recipe.method || '').toLowerCase()}`));
  route.append(element(doc, 'code', recipe.path || (recipe.binding ? '실제 경로를 입력하세요' : '경로 미정')));
  route.append(element(doc, 'strong', (recipe.expected?.statuses || []).join(' / ') || (recipe.binding ? '상태를 직접 정함' : '상태 미정')));
  view.append(route);
  const description = recipe.expected?.description || recipe.description;
  if (description) view.append(element(doc, 'p', description, 'sf-contract-description'));
  view.append(element(doc, 'h4', '요청 필드'));
  const fields = Array.isArray(recipe.requestFields) ? recipe.requestFields : [];
  if (!fields.length) {
    view.append(element(doc, 'p', recipe.binding ? '원문에 등록된 요청 필드가 없습니다. 실제 과제와 서버를 확인해 직접 계약을 입력하세요.' : '별도 요청 필드가 없습니다.', 'sf-no-fields'));
  } else {
    const wrapper = element(doc, 'div', null, 'sf-contract-table-wrap');
    const table = element(doc, 'table', null, 'sf-contract-table');
    const head = doc.createElement('thead');
    const headRow = doc.createElement('tr');
    for (const label of ['필드', '위치', '형식', '필수', '조건·설명']) headRow.append(element(doc, 'th', label));
    head.append(headRow);
    const body = doc.createElement('tbody');
    for (const field of fields) {
      const row = doc.createElement('tr');
      const fieldName = doc.createElement('th');
      fieldName.scope = 'row';
      fieldName.append(element(doc, 'span', field.label || field.name || '필드'));
      if (field.label && field.name) fieldName.append(element(doc, 'code', field.name));
      row.append(fieldName);
      row.append(element(doc, 'td', field.in || field.location || 'JSON'));
      row.append(element(doc, 'td', field.type || '미정'));
      row.append(element(doc, 'td', field.required ? '필수' : '선택'));
      row.append(element(doc, 'td', field.help || field.constraint || ''));
      body.append(row);
    }
    table.append(head, body);
    wrapper.append(table);
    view.append(wrapper);
  }
  view.append(element(doc, 'h4', 'API 실패 사례'));
  const failures = recipe.failures || recipe.expected?.failures || recipe.sourceCases || [];
  if (!failures.length) {
    view.append(element(doc, 'p', '등록된 실패 사례가 없습니다.', 'sf-no-fields'));
  } else {
    const list = element(doc, 'ul', null, 'sf-contract-failures');
    for (const failure of failures) {
      const item = doc.createElement('li');
      const statuses = failure.expected?.statuses || failure.statuses || (failure.status ? [failure.status] : []);
      if (statuses.length) item.append(element(doc, 'span', statuses.join(' / ')));
      const label = failure.label || failure.when || failure.condition || failure.expected?.description || '';
      item.append(element(doc, 'strong', label));
      const result = failure.result || failure.expected?.description;
      if (result && result !== label) item.append(element(doc, 'small', result));
      list.append(item);
    }
    view.append(list);
  }
}

function mountApiContracts(root) {
  for (const panel of root.querySelectorAll('[data-sf-stage-panel]')) {
    const contract = panel.querySelector('[data-sf-api-contract]');
    const data = contract?.querySelector('[data-sf-contract-data]');
    if (!contract || !data) continue;
    let recipes = [];
    try { recipes = JSON.parse(data.textContent || '[]'); } catch {}
    const request = panel.querySelector('[data-srq-root]');
    const picker = request?.querySelector('[data-srq-recipe]');
    const view = contract.querySelector('[data-sf-contract-view]');
    const sync = () => renderContractView(view, recipes[Number(picker?.value || 0)] || recipes[0]);
    picker?.addEventListener('change', sync);
    sync();
  }
}

function safeStorage(doc, injected) {
  if (injected) return injected;
  try { return doc.defaultView?.localStorage ?? null; } catch { return null; }
}

function readProgress(storage) {
  if (!storage) return { version: 1, completed: {} };
  try {
    const value = JSON.parse(storage.getItem(PROGRESS_KEY) || 'null');
    if (value?.version === 1 && value.completed && typeof value.completed === 'object') return value;
  } catch {}
  return { version: 1, completed: {} };
}

function writeProgress(storage, progress) {
  try { storage?.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch {}
}

function mountCatalog(root, storage) {
  const win = root.ownerDocument.defaultView;
  const viewForHash = hash => hash === '#journey-all-apis' ? 'api' : hash === '#visual-catalog' ? 'preview' : 'features';
  function selectView(view, updateUrl = false) {
    root.dataset.sfView = view;
    const title=root.querySelector('#sf-feature-list-title');
    if(title) title.textContent=view === 'preview' ? '단계별 시안으로 고르기' : '만들 기능 고르기';
    root.querySelector('.sf-feature-list').hidden = view === 'api';
    root.querySelector('.sf-api-explorer').hidden = view !== 'api';
    for (const button of root.querySelectorAll('[data-sf-view-button]')) button.setAttribute('aria-pressed', String(button.dataset.sfViewButton === view));
    if (updateUrl && win?.history) {
      const url = new URL(win.location.href); url.hash = view === 'api' ? 'journey-all-apis' : view === 'preview' ? 'visual-catalog' : '';
      win.history.pushState({}, '', url);
    }
  }
  for (const button of root.querySelectorAll('[data-sf-view-button]')) button.addEventListener('click', () => selectView(button.dataset.sfViewButton, true));
  root.ownerDocument.addEventListener('click', event => {
    const link = event.target.closest?.('a'); if (!link || !win?.location) return;
    const url = new URL(link.href, win.location.href);
    if (url.pathname === win.location.pathname && ['', '#visual-catalog', '#journey-all-apis'].includes(url.hash)) {
      event.preventDefault(); selectView(viewForHash(url.hash), true);
    }
  });
  win?.addEventListener('popstate', () => selectView(viewForHash(win.location.hash)));
  selectView(viewForHash(win?.location?.hash));

  const cards = [...root.querySelectorAll('[data-sf-feature-card]')];
  const search = root.querySelector('[data-sf-search]');
  const difficulty = root.querySelector('[data-sf-difficulty]');
  const project = root.querySelector('[data-sf-project]');
  const visibleCount = root.querySelector('[data-sf-visible-count]');
  const empty = root.querySelector('[data-sf-empty]');
  const progress = readProgress(storage);
  for (const card of cards) {
    const legacy = !!progress.completed?.[card.dataset.sfId];
    const variants = Object.values(progress.stages?.[card.dataset.sfId] || {});
    const hasStageRecords = variants.some((stages) => Object.values(stages || {}).some(Boolean));
    card.querySelector('[data-sf-progress-badge]')?.toggleAttribute('hidden', !legacy && !hasStageRecords);
  }
  const groups = [...root.querySelectorAll('[data-sf-feature-group]')];
  for (const [index, group] of groups.entries()) {
    const content = group.querySelector('[data-sf-group-cards]');
    const button = group.querySelector('[data-sf-group-collapse]');
    const expanded = group.dataset.sfGroupName === '개발 준비' || (!groups.some((item) => item.dataset.sfGroupName === '개발 준비') && index === 0);
    if (content && button) {
      content.hidden = !expanded;
      button.setAttribute('aria-expanded', String(expanded));
      const icon = button.querySelector('span[aria-hidden=true]');
      if (icon) icon.textContent = expanded ? '⌄' : '›';
    }
  }

  function applyFilters() {
    const query = (search?.value || '').trim().toLocaleLowerCase();
    const level = difficulty?.value || '';
    const selectedProject = project?.value || '';
    let count = 0;
    for (const card of cards) {
      const matched = (!query || (card.dataset.sfSearch || '').toLocaleLowerCase().includes(query))
        && (!level || card.dataset.sfDifficulty === level)
        && (!selectedProject || (card.dataset.sfProjects || '').split('|').includes(selectedProject));
      card.hidden = !matched;
      if (matched) count++;
    }
    if (visibleCount) visibleCount.textContent = String(count);
    if (empty) empty.hidden = count !== 0;
    const hasFilter = !!query || !!level || !!selectedProject;
    for (const group of groups) {
      const matches = [...group.querySelectorAll('[data-sf-feature-card]')].filter((card) => !card.hidden);
      group.hidden = matches.length === 0;
      const countElement = group.querySelector('[data-sf-group-count]');
      if (countElement) countElement.textContent = String(matches.length);
      const collapse = group.querySelector('[data-sf-group-collapse]');
      const content = group.querySelector('[data-sf-group-cards]');
      if (content && collapse) {
        const expanded = hasFilter ? matches.length > 0 : group.dataset.sfGroupName === '개발 준비' || (!groups.some((item) => item.dataset.sfGroupName === '개발 준비') && groups.indexOf(group) === 0);
        content.hidden = !expanded;
        collapse.setAttribute('aria-expanded', String(expanded));
        const icon = collapse.querySelector('span[aria-hidden=true]');
        if (icon) icon.textContent = expanded ? '⌄' : '›';
      }
    }
  }
  for (const input of [search, difficulty, project]) input?.addEventListener('input', applyFilters);
  for (const input of [difficulty, project]) input?.addEventListener('change', applyFilters);
  root.querySelector('[data-sf-filter-form]')?.addEventListener('reset', () => setTimeout(applyFilters, 0));
  for (const button of root.querySelectorAll('[data-sf-group-collapse]')) button.addEventListener('click', () => {
    const content = button.closest('[data-sf-feature-group]')?.querySelector('[data-sf-group-cards]');
    if (!content) return;
    content.hidden = !content.hidden;
    button.setAttribute('aria-expanded', String(!content.hidden));
    const icon = button.querySelector('span[aria-hidden=true]');
    if (icon) icon.textContent = content.hidden ? '›' : '⌄';
  });
  applyFilters();

  const apiFilter = root.querySelector('[data-sf-api-filter]');
  const apiSearch = root.querySelector('[data-sf-api-search]');
  const apiProject = root.querySelector('[data-sf-api-project-filter]');
  let method = '';
  for (const [index, group] of [...root.querySelectorAll('[data-sf-api-group]')].entries()) {
    const rows = group.querySelector('[data-sf-api-rows]');
    const button = group.querySelector('[data-sf-api-collapse]');
    if (rows && button && index > 0) {
      rows.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      const icon = button.querySelector('span[aria-hidden=true]');
      if (icon) icon.textContent = '›';
    }
  }
  function applyApiFilters() {
    const query = (apiSearch?.value || '').trim().toLocaleLowerCase();
    const projectFilter = apiProject?.value || '';
    for (const row of root.querySelectorAll('[data-sf-api-row]')) {
      row.hidden = (query && !(row.dataset.sfSearch || '').toLocaleLowerCase().includes(query))
        || (method && row.dataset.sfMethod !== method)
        || (projectFilter && row.dataset.sfProject !== projectFilter);
    }
    for (const group of root.querySelectorAll('[data-sf-api-group]')) {
      const rows = group.querySelector('[data-sf-api-rows]');
      const collapse = group.querySelector('[data-sf-api-collapse]');
      const hasVisible = !!group.querySelector('[data-sf-api-row]:not([hidden])');
      group.hidden = !hasVisible;
      if (rows && hasVisible) rows.hidden = (query || method || projectFilter) ? false : collapse?.getAttribute('aria-expanded') !== 'true';
    }
  }
  apiSearch?.addEventListener('input', applyApiFilters);
  apiProject?.addEventListener('change', applyApiFilters);
  for (const button of root.querySelectorAll('[data-sf-method-filter]')) button.addEventListener('click', () => {
    method = button.dataset.sfMethodFilter || '';
    for (const candidate of root.querySelectorAll('[data-sf-method-filter]')) candidate.setAttribute('aria-pressed', String(candidate === button));
    applyApiFilters();
  });
  for (const button of root.querySelectorAll('[data-sf-api-collapse]')) button.addEventListener('click', () => {
    const rows = button.closest('[data-sf-api-group]')?.querySelector('[data-sf-api-rows]');
    if (!rows) return;
    rows.hidden = !rows.hidden;
    button.setAttribute('aria-expanded', String(!rows.hidden));
    const icon = button.querySelector('span[aria-hidden=true]');
    if (icon) icon.textContent = rows.hidden ? '›' : '⌄';
  });
}

function mountFeature(root, storage) {
  const featureId = root.dataset.sfFeature;
  const panels = [...root.querySelectorAll('[data-sf-stage-panel]')];
  if (!panels.length) return;
  const links = [...root.querySelectorAll('[data-sf-stage-link]')];
  const variantSelect = root.querySelector('[data-sf-variant-select]');
  const progress = readProgress(storage);
  mountApiContracts(root);
  const status = root.querySelector('[data-sf-progress-status]');
  const count = root.querySelector('[data-sf-progress-count]');
  const activeStages = () => panels.filter((panel) => panel.dataset.sfVariant === (variantSelect?.value || panels[0].dataset.sfVariant));
  const selectedStageFor = (variant) => panels.find((panel) => panel.dataset.sfVariant === variant) || panels[0];
  const isStageDone = (panel) => !!progress.stages?.[featureId]?.[panel.dataset.sfVariant]?.[panel.dataset.sfStage];

  function updateProgress() {
    for (const panel of panels) {
      const done = isStageDone(panel);
      const checkbox = panel.querySelector('[data-sf-stage-complete]');
      if (checkbox) checkbox.checked = done;
      const link = links.find((item) => item.dataset.sfVariant === panel.dataset.sfVariant && item.dataset.sfStage === panel.dataset.sfStage);
      const indicator = link?.querySelector('[data-sf-stage-indicator]');
      if (indicator) {
        indicator.textContent = done ? '완료' : '미완료';
        indicator.setAttribute('aria-label', done ? '완료 기록 있음' : '완료 기록 없음');
      }
      const aside = [...root.querySelectorAll('[data-sf-aside-stage]')].find((item) => item.dataset.sfVariant === panel.dataset.sfVariant && item.dataset.sfStage === panel.dataset.sfStage);
      const asideStatus = aside?.querySelector('[data-sf-aside-progress]');
      if (asideStatus) asideStatus.textContent = done ? '이 단계의 완료 기록 있음' : '이 단계의 완료 기록 없음';
    }
    const currentVariant = variantSelect?.value || panels[0].dataset.sfVariant;
    const currentPanels = activeStages();
    const doneCount = currentPanels.filter(isStageDone).length;
    const total = currentPanels.length;
    const variantLabel = variantSelect?.selectedOptions?.[0]?.textContent || currentVariant;
    if (count) count.textContent = `${doneCount} / ${total}`;
    if (status) status.textContent = total > 0 && doneCount === total
      ? `${variantLabel} 프로젝트의 모든 단계(${doneCount}/${total}) 완료 조건을 직접 확인했습니다.`
      : `${variantLabel} 프로젝트에서 ${doneCount}/${total}단계의 완료 조건을 직접 확인했습니다.`;
  }

  function writeLocation(variant, stage, push) {
    const view = root.ownerDocument.defaultView;
    if (!view?.history?.pushState || !view.location) return;
    const url = new URL(view.location.href);
    url.searchParams.set('variant', variant);
    url.searchParams.set('stage', stage);
    url.hash = `sf-stage-${variant}-${stage}`;
    view.history[push ? 'pushState' : 'replaceState']({ sfFeature: featureId, variant, stage }, '', url);
  }

  function activate(variant, stage, { push = false, focus = false, updateUrl = true } = {}) {
    let selected = panels.find((panel) => panel.dataset.sfVariant === variant && panel.dataset.sfStage === stage);
    if (!selected) selected = panels[0];
    if (variantSelect) variantSelect.value = selected.dataset.sfVariant;
    for (const panel of panels) panel.hidden = panel !== selected;
    for (const hintPanel of root.querySelectorAll('[data-sf-aside-stage]')) {
      hintPanel.hidden = hintPanel.dataset.sfVariant !== selected.dataset.sfVariant || hintPanel.dataset.sfStage !== selected.dataset.sfStage;
    }
    for (const link of links) {
      const current = link.dataset.sfVariant === selected.dataset.sfVariant && link.dataset.sfStage === selected.dataset.sfStage;
      link.setAttribute('aria-current', current ? 'step' : 'false');
    }
    updateProgress();
    if (updateUrl) writeLocation(selected.dataset.sfVariant, selected.dataset.sfStage, push);
    if (focus) {
      const heading = selected.querySelector('.sf-stage-title h2');
      heading?.focus({ preventScroll: true });
    }
    return selected;
  }

  for (const link of links) link.addEventListener('click', () => activate(link.dataset.sfVariant, link.dataset.sfStage, { push: true, focus: true }));
  variantSelect?.addEventListener('change', () => {
    const selected = selectedStageFor(variantSelect.value);
    if (selected) activate(selected.dataset.sfVariant, selected.dataset.sfStage, { push: true, focus: true });
  });

  for (const hints of root.querySelectorAll('[data-sf-hints]')) {
    let items = [];
    try { items = JSON.parse(hints.querySelector('[data-sf-hints-data]')?.textContent || '[]'); } catch {}
    const open = hints.querySelector('[data-sf-hint-open]');
    const card = hints.querySelector('[data-sf-hint-card]');
    const text = hints.querySelector('[data-sf-hint-text]');
    const countLabel = hints.querySelector('[data-sf-hint-count]');
    const prev = hints.querySelector('[data-sf-hint-prev]');
    const next = hints.querySelector('[data-sf-hint-next]');
    let index = -1;
    const draw = () => {
      if (text) text.textContent = String(items[index] ?? '');
      if (countLabel) countLabel.textContent = `질문 ${index + 1} / ${items.length}`;
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= items.length - 1;
      if (open) open.hidden = index >= 0;
      if (card) card.hidden = index < 0;
    };
    open?.addEventListener('click', () => { if (items.length) { index = 0; draw(); } });
    prev?.addEventListener('click', () => { if (index > 0) { index--; draw(); } });
    next?.addEventListener('click', () => { if (index < items.length - 1) { index++; draw(); } });
    draw();
  }

  for (const panel of panels) panel.querySelector('[data-sf-stage-complete]')?.addEventListener('change', (event) => {
    const variant = panel.dataset.sfVariant;
    const stage = panel.dataset.sfStage;
    progress.stages ||= {};
    progress.stages[featureId] ||= {};
    progress.stages[featureId][variant] ||= {};
    if (event.currentTarget.checked) progress.stages[featureId][variant][stage] = true;
    else delete progress.stages[featureId][variant][stage];
    writeProgress(storage, progress);
    updateProgress();
  });
  updateProgress();

  const view = root.ownerDocument.defaultView;
  const fromLocation = () => {
    const url = new URL(view.location.href);
    let variant = url.searchParams.get('variant');
    let stage = url.searchParams.get('stage');
    const hashPanel = panels.find((panel) => panel.id === decodeURIComponent(url.hash.slice(1)));
    if (hashPanel) { variant = hashPanel.dataset.sfVariant; stage = hashPanel.dataset.sfStage; }
    if (!variant || !stage) {
      variant = panels[0].dataset.sfVariant;
      stage = panels[0].dataset.sfStage;
    }
    return { variant, stage };
  };
  if (view?.location) {
    const initial = fromLocation();
    activate(initial.variant, initial.stage, { updateUrl: false });
    view.addEventListener('popstate', () => { const state = fromLocation(); activate(state.variant, state.stage, { updateUrl: false }); });
    view.addEventListener('hashchange', () => { const state = fromLocation(); activate(state.variant, state.stage, { updateUrl: false }); });
  }
  root.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target?.tagName || '')) return;
    const current = panels.findIndex((panel) => !panel.hidden);
    const available = activeStages();
    const index = available.findIndex((panel) => panel === panels[current]);
    const next = available[index + (event.key === 'ArrowRight' ? 1 : -1)];
    if (next) { event.preventDefault(); activate(next.dataset.sfVariant, next.dataset.sfStage, { push: true, focus: true }); }
  });
}

/** 기존 저장소와 분리된 서비스 기능 진도 및 화면 동작을 초기화한다. */
export function mountServiceFeaturePages(doc = globalThis.document, { storage } = {}) {
  if (!doc?.querySelectorAll) return [];
  const store = safeStorage(doc, storage);
  const mounted = [];
  for (const catalog of doc.querySelectorAll('[data-sf-catalog]')) { mountCatalog(catalog, store); mounted.push(catalog); }
  for (const feature of doc.querySelectorAll('[data-sf-feature]')) { mountFeature(feature, store); mounted.push(feature); }
  return mounted;
}
