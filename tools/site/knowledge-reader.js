const READER_KEY = '__javaExperienceKnowledgeReader';
const initialized = new WeakSet();

function initKnowledgeReader(doc = document, win = window) {
  const root = doc.querySelector('[data-knowledge-reader]');
  if (!root || initialized.has(root)) return false;
  initialized.add(root);
  let metadata = {};
  try { metadata = JSON.parse(root.dataset.krMetadata || '{}'); } catch {}
  const scene = root.querySelector('[data-kr-scene]');
  const reading = root.querySelector('[data-kr-reading]');
  const controls = root.querySelector('.kr-controls');
  const buttons = [...root.querySelectorAll('[data-kr-mode]')];
  const hasScene = metadata.hasScene && !!scene && !!controls;
  const params = () => new URLSearchParams(win.location.search);
  const decodeHash = () => {
    if (!win.location.hash || win.location.hash.length < 2) return '';
    try { return decodeURIComponent(win.location.hash.slice(1)); } catch { return ''; }
  };
  const reveal = (id, moveFocus = false) => {
    const target = id && doc.getElementById(id);
    if (!target || !reading.contains(target)) return false;
    let parent = target.closest('details.knowledge-topic, details.knowledge-chapter');
    while (parent) { parent.open = true; parent = parent.parentElement?.closest('details.knowledge-topic, details.knowledge-chapter'); }
    for (let parentNode = target.parentElement; parentNode && parentNode !== reading; parentNode = parentNode.parentElement) {
      if (parentNode.tagName === 'DETAILS') parentNode.open = true;
    }
    if (moveFocus) {
      const focusTarget = target.tagName === 'H1' ? root.querySelector('.kr-reading-title') : target;
      focusTarget?.setAttribute('tabindex', '-1');
      focusTarget?.focus({ preventScroll: true });
      focusTarget?.scrollIntoView?.({ block: 'start' });
    }
    return true;
  };
  const setMode = (mode, { updateUrl = true, focus = true } = {}) => {
    const normalized = mode === 'scene' && hasScene ? 'scene' : 'read';
    const readMode = normalized === 'read';
    root.dataset.krMode = normalized;
    root.classList.toggle('is-reading', readMode);
    root.classList.toggle('is-scene', !readMode);
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.krMode === normalized)));
    scene.hidden = readMode;
    reading.hidden = !readMode;
    const p = params();
    if (readMode) {
      p.set('read', '1');
      reading.querySelectorAll('details.knowledge-chapter').forEach((chapter) => {
        const label = chapter.querySelector(':scope > summary .knowledge-chapter-heading strong')?.textContent || chapter.querySelector(':scope > summary')?.textContent || '';
        const review = /(자가\s*점검|확인\s*질문|생각해\s*보기|스스로\s*점검|Q\s*&\s*A|면접\s*대비)/i.test(label);
        const optional = /(참고문헌|참고\s*자료|한\s*단계\s*더|심화|깊이\s*보기|선택\s*학습|부록)/i.test(label);
        chapter.open = !optional;
        chapter.querySelectorAll('details.knowledge-topic').forEach((topic) => { topic.open = !review && !optional; });
      });
      reading.querySelectorAll('details[class$="-original"]').forEach((item) => { item.open = !!item.querySelector('.knowledge-chapters, .knowledge-chapter'); });
      reading.querySelectorAll('details.version-original, details.jpa-focus-deep, details.mybatis-focus-deep, details.tx-why-map, details.tx-life-map').forEach((item) => { item.open = false; });
    } else {
      p.delete('read');
    }
    if (updateUrl) {
      const url = new URL(win.location.href);
      url.search = p.toString();
      const currentHash = decodeHash();
      if (!readMode && reveal(currentHash, false)) url.hash = '';
      const state = win.history.state && typeof win.history.state === 'object' ? win.history.state : {};
      win.history.replaceState({ ...state, [READER_KEY]: normalized }, '', url);
    }
    if (focus) {
      const targetId = decodeHash();
      const target = targetId && doc.getElementById(targetId);
      (readMode ? (target && reading.contains(target) ? target : root.querySelector('.kr-reading-title')) : buttons.find((item) => item.dataset.krMode === 'scene'))?.focus?.({ preventScroll: true });
      if (readMode && target && reading.contains(target)) reveal(targetId, true);
      else if (readMode) root.querySelector('.kr-reading-title')?.scrollIntoView?.({ block: 'start' });
    }
  };
  buttons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.krMode)));
  doc.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-kr-toc-link]');
    if (!link) return;
    const id = decodeURIComponentSafe(link.hash);
    setMode('read', { updateUrl: false, focus: false });
    reveal(id, true);
  });
  const sync = () => {
    const stateMode = win.history.state?.[READER_KEY];
    const id = decodeHash();
    if (id && reveal(id, false)) { setMode('read', { updateUrl: false, focus: false }); reveal(id, true); return; }
    setMode(params().get('read') === '1' ? 'read' : stateMode === 'scene' ? 'scene' : hasScene ? 'scene' : 'read', { updateUrl: false, focus: false });
  };
  const initialHash = decodeHash();
  const opensSource = initialHash && reveal(initialHash, false);
  const initial = opensSource ? 'read' : params().get('read') === '1' ? 'read' : hasScene ? 'scene' : 'read';
  setMode(initial, { updateUrl: true, focus: !!opensSource });
  win.addEventListener('popstate', sync);
  win.addEventListener('hashchange', sync);
  return true;
}

function decodeURIComponentSafe(value) { try { return decodeURIComponent(value.replace(/^#/, '')); } catch { return ''; } }

if (typeof document !== 'undefined') {
  const start = () => initKnowledgeReader(document, window);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
