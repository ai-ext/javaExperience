import { initP16JsonVisual } from './p16-json-visual.js';
import { readProgress, TASKS } from './home-state.mjs';

export const CATALOG_RETURN_KEY = 'javaexperience.knowledge.return.v1';
export const CATALOG_HISTORY_KEY = '__javaExperienceKnowledge';
const ENTRY_PREFIX = 'javaexperience:knowledge:v8:entry:';
const categories = ['all', 'java', 'request', 'data', 'delivery'];
const hashCategory = (hash) => {
  let id; try { id = decodeURIComponent(hash).match(/^#kc-category-(.+)$/)?.[1]; } catch { return null; }
  return categories.includes(id) ? id : null;
};
const safeRead = (storage, key) => { try { return JSON.parse(storage.getItem(key)); } catch { return null; } };
const safeWrite = (storage, key, value) => { try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const safeRemove = (storage, key) => { try { storage.removeItem(key); } catch {} };
const normalize = (value) => String(value ?? '').normalize('NFKC').toLocaleLowerCase('ko').trim().replace(/\s+/g, ' ');
const clip = (value) => String(value ?? '').trim().slice(0, 160);
const plainClick = (event, link) => !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && !link.hasAttribute('download') && (!link.target || link.target === '_self');

/** 검색 상태는 history entry별로 저장한다. 학습 과제 진도에는 쓰지 않는다. */
export function initKnowledgeCatalog(doc, win, { navigate = (href) => win.location.assign(href) } = {}) {
  const root = doc.querySelector('.kc-catalog');
  const storage = (name) => { try { return win[name]; } catch { return { getItem: () => null, setItem: () => {}, removeItem: () => {} }; } };
  const session = storage('sessionStorage');
  const local = storage('localStorage');
  const uid = () => win.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const foreignState = () => win.history.state && typeof win.history.state === 'object' && !Array.isArray(win.history.state) ? win.history.state : {};
  const writeHistory = (method, entry, href) => {
    try { win.history[method]({ ...foreignState(), [CATALOG_HISTORY_KEY]: entry }, '', href); return true; } catch { return false; }
  };
  const progress = readProgress(local);
  const active = TASKS[progress.active];
  for (const link of doc.querySelectorAll('[data-kc-task-return]')) {
    if (!active) continue;
    link.hidden = false; link.href = new URL('../../' + active.href, win.location.href).href;
    link.textContent = `${active.id} 하던 과제로 돌아가기 →`;
  }
  // 일반 링크로 건넨 일회 토큰만 받는다. 복사된 세션 캐시만으로는 origin을 만들지 않는다.
  if (!root) {
    const url = new URL(win.location.href);
    const pending = safeRead(session, CATALOG_RETURN_KEY);
    const token = url.searchParams.get('kcOrigin');
    const target = new URL(url); target.searchParams.delete('kcOrigin');
    let entry = foreignState()[CATALOG_HISTORY_KEY];
    const sameReferrer = url.protocol === 'file:' || doc.referrer.split('#')[0] === pending?.origin?.listHref?.split('#')[0];
    const validList = (list, origin) => {
      if (list?.schema !== 1 || list.entryId !== origin?.listEntryId || list.href !== origin?.listHref || typeof list.queryRaw !== 'string') return false;
      try { const href = new URL(list.href);const expected = new URL('README.html', win.location.href);return href.origin === expected.origin && href.pathname === expected.pathname; } catch { return false; }
    };
    if (token && pending?.schema === 1 && pending.token === token && pending.targetHref === target.href && Number.isFinite(pending.time) && Date.now() >= pending.time && Date.now() - pending.time < 60000 && sameReferrer) {
      const list = safeRead(session, ENTRY_PREFIX + pending.origin?.listEntryId);
      if (validList(list, pending.origin)) {
        entry = { schema: 1, entryId: uid(), parentEntryId: list.entryId, route: url.pathname, href: target.href, view: 'detail', origin: pending.origin };
        writeHistory('replaceState', entry, target.href);
      }
      safeRemove(session, CATALOG_RETURN_KEY);
    }
    const origin = entry?.schema === 1 && entry.route === url.pathname && entry.view === 'detail' && entry.parentEntryId === entry.origin?.listEntryId ? entry.origin : null;
    const list = origin && safeRead(session, ENTRY_PREFIX + origin.listEntryId);
    const valid = validList(list, origin);
    for (const back of doc.querySelectorAll('[data-kc-catalog-return]')) {
      back.textContent = valid ? list.queryRaw ? '검색 결과로 돌아가기' : '개념 목록으로 돌아가기' : '개념 목록으로';
      back.href = valid ? list.href : 'README.html';
      if (valid) back.addEventListener('click', (event) => {
        if (plainClick(event, back)) {
          event.preventDefault();
          if (win.location.href === entry.href) win.history.back();
          else { const target = new URL(list.href);target.searchParams.set('kcReturn', list.entryId);navigate(target.href); }
        }
      });
    }
    return;
  }
  const revealOriginal = (hash) => {
    let id; try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const original = doc.getElementById('kc-original'); const target = doc.getElementById(id);
    if (original && target && (target === original || original.contains(target))) {
      original.open = true;
      for (let parent = target.parentElement; parent && parent !== original; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
    }
  };
  doc.addEventListener('click', (event) => { const link = event.target.closest('a[href^="#"]'); if (link) revealOriginal(link.hash); });
  win.addEventListener('hashchange', () => revealOriginal(win.location.hash));
  if (win.location.hash) revealOriginal(win.location.hash);
  if (root.dataset.ready) return;
  root.dataset.ready = 'true';
  const $ = (selector) => root.querySelector(selector) || doc.querySelector('.page-sidebar')?.querySelector(selector);
  const input = $('#knowledge-search-input');
  const rows = [...root.querySelectorAll('[data-kc-document]')];
  const aliases = new Map();
  try {
    const configured = JSON.parse($('[data-kc-aliases]')?.textContent || '{}');
    for (const [question, literal] of Object.entries(configured)) if (typeof literal === 'string') aliases.set(normalize(question), normalize(literal));
  } catch {}
  const contextMap = { '0-1': 'P09', '0-2': 'P03', '1-1': 'P16', '1-2': 'W09' };
  const contextId = contextMap[active?.id];
  const context = contextId && rows.find((row) => row.dataset.kcDocument === contextId);
  if (context) {
    $('[data-kc-context-tag]').textContent = `${active.id} ${active.title}`;
    const target = $('[data-kc-context-body]'); target.append(context.querySelector('.kc-result-main').cloneNode(true));
    const link = doc.createElement('a'); link.href = context.querySelector('h3 a').getAttribute('href'); link.dataset.kcOpen = contextId; link.textContent = '개념 보기 →'; target.append(link);
  }
  function fromUrl() {
    const url = new URL(win.location.href); const query = clip(url.searchParams.get('q'));
    return { schema: 1, entryId: uid(), route: url.pathname, queryRaw: query, inputDraft: query, categoryId: hashCategory(url.hash) || (categories.includes(url.searchParams.get('category')) ? url.searchParams.get('category') : query ? 'all' : 'java'), sort: url.searchParams.get('sort') === 'title' ? 'title' : 'relevance', expanded: url.searchParams.get('all') === '1', view: query ? 'results' : 'browse', selectedDocId: null, focusKey: null, scroll: url.hash ? {} : { absoluteY: 0 } };
  }
  function validEntry(value) {
    return value?.schema === 1 && typeof value.entryId === 'string' && value.route === win.location.pathname && ['browse','results'].includes(value.view) && typeof value.queryRaw === 'string' && typeof value.inputDraft === 'string' && categories.includes(value.categoryId) && ['title','relevance'].includes(value.sort);
  }
  function currentEntry() {
    const value = foreignState()[CATALOG_HISTORY_KEY];
    if (!validEntry(value)) {
      // 원문 anchor의 native history는 건드리지 않고 명시 목록 복귀 때만 snapshot을 받는다.
      const url = new URL(win.location.href);const returnId = url.searchParams.get('kcReturn');url.searchParams.delete('kcReturn');
      const returned = returnId && safeRead(session, ENTRY_PREFIX + returnId);
      if (validEntry(returned) && returned.entryId === returnId && returned.href === url.href) return { ...returned, entryId: uid(), parentEntryId: returnId };
      return fromUrl();
    }
    const cached = safeRead(session, ENTRY_PREFIX + value.entryId);
    return validEntry(cached) && cached.entryId === value.entryId && cached.href === win.location.href ? cached : value;
  }
  let entry = currentEntry();
  let composing = false; let matches = [];
  const resultLink = (id) => rows.find((row) => row.dataset.kcDocument === id)?.querySelector('h3 a');
  function params() {
    const value = new URLSearchParams(win.location.search);
    for (const key of ['q','category','all','sort','kcReturn']) value.delete(key);
    if (entry.queryRaw) value.set('q', entry.queryRaw);
    value.set('category', entry.categoryId);
    if (entry.expanded) value.set('all', '1');
    if (entry.sort === 'title') value.set('sort', 'title');
    return value;
  }
  function entryHref() {
    const url = new URL(win.location.href);url.search = params().toString();
    if (hashCategory(url.hash)) url.hash = 'kc-category-' + entry.categoryId;
    return url.href;
  }
  function focusKey() {
    const current = doc.activeElement;
    if (current?.closest('[data-kc-open]')) return 'document:' + current.closest('[data-kc-open]').dataset.kcOpen;
    if (current?.matches('button[data-kc-category]')) return 'category:' + current.dataset.kcCategory;
    if (current === $('[data-kc-sort]')) return 'sort';
    if (current === $('[data-kc-results-title]')) return 'results';
    return entry.focusKey;
  }
  function remember(write = false, selectedDocId) {
    const id = selectedDocId || doc.activeElement?.closest('[data-kc-open]')?.dataset.kcOpen || entry.selectedDocId;
    const row = rows.find((item) => item.dataset.kcDocument === id && !item.hidden);
    entry = { ...entry, inputDraft: input.value, selectedDocId: id || null, focusKey: selectedDocId ? 'document:' + selectedDocId : focusKey(), scroll: { itemKey: row?.dataset.kcDocument || null, offsetFromViewportTop: row?.getBoundingClientRect().top || 0, absoluteY: win.scrollY, viewportWidth: win.innerWidth } };
    safeWrite(session, ENTRY_PREFIX + entry.entryId, entry);
    if (write) writeHistory('replaceState', entry);
  }
  function draftNotice() {
    const note = $('[data-kc-draft]');
    if (note) { note.hidden = input.value === entry.queryRaw; note.textContent = note.hidden ? '' : '입력 중인 질문입니다. 검색을 누르면 결과에 반영됩니다.'; }
    $('[data-kc-search-clear]').hidden = !input.value && !entry.queryRaw;
  }
  function render() {
    input.value = entry.inputDraft;
    const raw = normalize(entry.queryRaw); const literal = aliases.get(raw) || raw;
    const words = literal.split(/\s+/).filter(Boolean);
    matches = rows.filter((row) => (raw && [row.dataset.kcQuestion, row.querySelector('h3 a')?.textContent].some((question) => normalize(question) === raw)) || words.every((word) => normalize(row.dataset.kcSearch).includes(word)));
    const filtered = matches.filter((row) => entry.categoryId === 'all' || row.dataset.kcCategory === entry.categoryId);
    const dtoOrder = ['P16', 'W09', 'P06', 'P02', 'P03', 'P25', 'W10'];
    const priority = (row) => {
      if (!raw) return Number(row.dataset.kcBrowseRank ?? row.dataset.kcRank ?? 100);
      if (row.dataset.kcDocument === contextId) return -100;
      if (words.includes('dto') && dtoOrder.includes(row.dataset.kcDocument)) return dtoOrder.indexOf(row.dataset.kcDocument);
      return Number(row.dataset.kcRank ?? 100);
    };
    const title = (row) => (row.dataset.kcTitle || row.querySelector('.kc-source')?.textContent || row.dataset.kcDocument).replace(/^[A-Z]\d+\.\s*/, '');
    filtered.sort((a, b) => (entry.sort === 'title' ? title(a).localeCompare(title(b), 'ko') : priority(a) - priority(b)) || a.dataset.kcDocument.localeCompare(b.dataset.kcDocument));
    const show = entry.queryRaw || entry.expanded || entry.categoryId === 'all' ? filtered : filtered.slice(0, 3);
    rows.forEach((row) => { row.hidden = true; const badge = row.querySelector('[data-kc-badge]'); if (badge) badge.hidden = row.dataset.kcDocument !== contextId; });
    for (const row of show) {
      row.hidden = false; $('[data-kc-results]').append(row);
      const reason = row.querySelector('[data-kc-match-reason]');
      if (reason) {
        reason.hidden = !raw;
        reason.textContent = aliases.has(raw) || [row.dataset.kcQuestion, row.querySelector('h3 a')?.textContent].some((question) => normalize(question) === raw) ? '등록된 질문과 일치' : words.every((word) => normalize(row.dataset.kcTitle || row.querySelector('.kc-source')?.textContent).includes(word)) ? '문서 제목과 일치' : '소제목과 일치';
      }
    }
    for (const button of doc.querySelectorAll('button[data-kc-category]')) {
      const selected = button.dataset.kcCategory === entry.categoryId;
      button.setAttribute('aria-pressed', String(selected)); button.tabIndex = selected ? 0 : -1;
    }
    $('[data-kc-category-select]').value = entry.categoryId;
    $('[data-kc-sort]').value = entry.sort;
    $('[data-kc-hero-title]').textContent = entry.queryRaw ? '개념 검색' : '막힌 개념을, 값의 변화로 이해하세요.';
    for (const part of root.querySelectorAll('[data-kc-discovery]')) part.hidden = Boolean(entry.queryRaw);
    $('[data-kc-context]').hidden = Boolean(entry.queryRaw) || !context;
    const label = $(`button[data-kc-category="${entry.categoryId}"]`)?.dataset.kcLabel || '전체';
    $('[data-kc-results-title]').textContent = entry.queryRaw ? `${entry.queryRaw} 검색 결과 ${filtered.length}개` : `${label} · ${filtered.length}개 문서`;
    $('[data-kc-results-basis]').textContent = entry.queryRaw ? '문서 제목·소제목에서 찾았습니다.' : show.length < filtered.length ? `먼저 살펴볼 질문 ${show.length}개입니다.` : '문서를 선택해 개념을 살펴보세요.';
    $('[data-kc-empty]').hidden = filtered.length > 0;
    $('[data-kc-empty-title]').textContent = entry.queryRaw ? entry.categoryId === 'all' ? `‘${entry.queryRaw}’에 맞는 문서를 찾지 못했어요.` : `선택한 분야에는 ‘${entry.queryRaw}’ 관련 문서가 없어요.` : '이 분야에 표시할 문서가 없습니다.';
    $('[data-kc-empty-description]').textContent = matches.length ? `다른 분야에는 ${matches.length}개 문서가 있습니다. 검색어는 그대로 두고 분야만 해제해 보세요.` : '짧은 기술명이나 문서 번호로 질문을 수정해 보세요. 검색 범위는 제목과 소제목입니다.';
    const recover = $('[data-kc-filter-reset]');recover.hidden = false;recover.textContent = matches.length && entry.categoryId !== 'all' ? `필터 해제하고 ${matches.length}개 보기` : '검색어 수정';
    $('[data-kc-more]').hidden = Boolean(entry.queryRaw) || show.length >= filtered.length;
    $('[data-kc-more]').textContent = `${label} ${filtered.length}개 모두 보기`;
    draftNotice();
  }
  function restore() {
    render();
    const key = entry.focusKey || '';
    const focus = key.startsWith('document:') ? resultLink(key.slice(9)) : key.startsWith('category:') ? $(`button[data-kc-category="${key.slice(9)}"]`) : key === 'sort' ? $('[data-kc-sort]') : key === 'results' ? $('[data-kc-results-title]') : null;
    if (focus && !focus.closest('[hidden]')) focus.focus({ preventScroll: true });
    const saved = entry.scroll;
    if (Number.isFinite(saved?.absoluteY)) {
      const row = rows.find((item) => item.dataset.kcDocument === saved.itemKey && !item.hidden);
      const top = row && saved.viewportWidth === win.innerWidth ? win.scrollY + row.getBoundingClientRect().top - saved.offsetFromViewportTop : saved.absoluteY;
      win.scrollTo(0, Math.max(0, top));
    }
  }
  function commit(changes, focusResults = false) {
    remember(true);
    const before = [entry.queryRaw, entry.categoryId, entry.sort, entry.expanded].join('\u0000');
    const next = { ...entry, ...changes };next.view = next.queryRaw ? 'results' : 'browse';
    const after = [next.queryRaw, next.categoryId, next.sort, next.expanded].join('\u0000');
    if (before !== after) {
      next.entryId = uid();next.parentEntryId = entry.entryId;next.scroll = { absoluteY: win.scrollY };next.selectedDocId = null;next.focusKey = null;
    }
    entry = next;entry.href = entryHref();
    if (Object.hasOwn(changes, 'categoryId')) {
      const url = new URL(entry.href);url.hash = 'kc-category-' + entry.categoryId;entry.href = url.href;
    }
    writeHistory(before === after ? 'replaceState' : 'pushState', entry, entry.href);
    safeWrite(session, ENTRY_PREFIX + entry.entryId, entry);render();
    if (focusResults) $('[data-kc-results-title]').focus({ preventScroll: true });
  }
  function search(value) { const query = clip(value);commit({ queryRaw: query, inputDraft: query, categoryId: entry.queryRaw ? entry.categoryId : 'all', expanded: false }, true); }
  $('.kc-search').addEventListener('submit', (event) => { event.preventDefault(); if (!composing && !event.isComposing) search(input.value); });
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; });
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && (composing || event.isComposing || event.keyCode === 229)) event.preventDefault(); });
  input.addEventListener('input', () => { remember(true);draftNotice(); });
  const clear = (focusInput = false) => { commit({ queryRaw: '', inputDraft: '', expanded: !focusInput }, !focusInput);if (focusInput) input.focus(); };
  $('[data-kc-search-clear]').addEventListener('click', () => clear(true));
  for (const button of root.querySelectorAll('[data-kc-query]')) button.addEventListener('click', () => search(button.dataset.kcQuery));
  const filter = (category) => { if (!categories.includes(category)) return; commit({ categoryId: category, expanded: false }); };
  for (const button of doc.querySelectorAll('button[data-kc-category]')) button.addEventListener('click', () => filter(button.dataset.kcCategory));
  const fieldButtons = [...doc.querySelectorAll('button[data-kc-category]')];
  for (const button of fieldButtons) button.addEventListener('keydown', (event) => {
    const index = fieldButtons.indexOf(button);
    const next = { ArrowLeft: (index + fieldButtons.length - 1) % fieldButtons.length, ArrowRight: (index + 1) % fieldButtons.length, Home: 0, End: fieldButtons.length - 1 }[event.key];
    if (next !== undefined) { event.preventDefault();fieldButtons[next].focus({preventScroll:true});filter(fieldButtons[next].dataset.kcCategory); }
  });
  $('[data-kc-category-select]').addEventListener('change', (event) => filter(event.target.value));
  $('[data-kc-sort]').addEventListener('change', (event) => { if (['title','relevance'].includes(event.target.value)) commit({ sort: event.target.value }); });
  $('[data-kc-filter-reset]').addEventListener('click', () => {
    if (matches.length && entry.categoryId !== 'all') commit({ categoryId: 'all' }, true);
    else { input.focus();input.select(); }
  });
  $('[data-kc-reset]').addEventListener('click', () => clear());
  $('[data-kc-more]').addEventListener('click', () => commit({ expanded: true }));
  root.addEventListener('click', (event) => {
    const link = event.target.closest('[data-kc-open]');
    if (link && plainClick(event, link)) {
      const target = new URL(link.href, win.location.href);
      if (target.origin !== win.location.origin || target.pathname === win.location.pathname) return;
      remember(true, link.dataset.kcOpen);
      const token = uid(); const origin = { listEntryId: entry.entryId, listHref: entry.href };
      const pending = { schema: 1, token, time: Date.now(), targetHref: target.href, origin };
      if (safeWrite(session, CATALOG_RETURN_KEY, pending)) target.searchParams.set('kcOrigin', token);
      event.preventDefault();navigate(target.href);
    }
    if (event.target.closest('[data-kc-original]')) { const original = doc.querySelector('#kc-original'); if (original) original.open = true; }
  });
  // popstate 시 URL/history.state는 이미 목적지다. 출발 snapshot은 세션에만 쓴다.
  win.addEventListener('popstate', () => { remember(false);entry = currentEntry();restore(); });
  win.addEventListener('hashchange', () => {
    const category = hashCategory(win.location.hash);
    if (!category || category === entry.categoryId) return;
    remember(false);entry = currentEntry();entry.categoryId = category;entry.href = win.location.href;
    writeHistory('replaceState', entry, entry.href);safeWrite(session, ENTRY_PREFIX + entry.entryId, entry);restore();
  });
  win.addEventListener('pageshow', (event) => { if (event.persisted) { entry = currentEntry();restore(); } });
  win.addEventListener('pagehide', () => remember(false));
  win.addEventListener('scroll', () => remember(false), { passive: true });
  entry.href ||= win.location.href;
  writeHistory('replaceState', entry, entry.href);
  safeWrite(session, ENTRY_PREFIX + entry.entryId, entry);
  restore();
}
if (typeof document !== 'undefined') { initKnowledgeCatalog(document, window); initP16JsonVisual(document, window); }
