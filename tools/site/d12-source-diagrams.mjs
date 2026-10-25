const initialized = new WeakMap();

export function installD12InitialAnchorGuard(doc = document, win = window) {
  const root = doc.querySelector('[data-d12-learning]');
  if (!root || root.dataset.d12InitialHashCaptured === 'true') return false;
  root.dataset.d12InitialHashCaptured = 'true';
  root.dataset.d12InitialHash = win.location.hash || '';
  root.dataset.d12InitialAnchorCanceled = 'false';
  let active = true;
  const cleanup = () => {
    if (!active) return;
    active = false;
    win.removeEventListener('wheel', onUserMove, true);
    win.removeEventListener('touchmove', onUserMove, true);
    win.removeEventListener('pointerdown', onUserMove, true);
    win.removeEventListener('keydown', onNavigationKey, true);
    win.removeEventListener('hashchange', onHashChange, true);
    win.removeEventListener('popstate', onHashChange, true);
    root.removeEventListener('d12-initial-anchor-settled', cleanup);
  };
  const cancel = () => {
    if (!active) return;
    root.dataset.d12InitialAnchorCanceled = 'true';
    cleanup();
  };
  const scrollKeys = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End',' ','Tab']);
  const onUserMove = () => cancel();
  const onNavigationKey = event => { if (scrollKeys.has(event.key) || event.code === 'Space') cancel(); };
  const onHashChange = () => cancel();
  win.addEventListener('wheel', onUserMove, { capture: true, passive: true });
  win.addEventListener('touchmove', onUserMove, { capture: true, passive: true });
  win.addEventListener('pointerdown', onUserMove, true);
  win.addEventListener('keydown', onNavigationKey, true);
  win.addEventListener('hashchange', onHashChange, true);
  win.addEventListener('popstate', onHashChange, true);
  root.addEventListener('d12-initial-anchor-settled', cleanup, { once: true });
  return true;
}

export function initD12SourceDiagrams(doc = document, win = window, mermaid = win.mermaid) {
  const reader = doc.querySelector('[data-knowledge-reader]');
  const reading = reader?.querySelector('[data-kr-reading]');
  const original = reader?.querySelector('#d12-original');
  const anchorRoot = reader?.querySelector('[data-d12-learning]');
  const nodes = original ? [...original.querySelectorAll('pre.mermaid')] : [];
  if (!reader || !reading || !original || !nodes.length || typeof mermaid?.run !== 'function') return null;
  if (initialized.has(reader)) return initialized.get(reader);
  if (anchorRoot?.dataset.d12InitialHashCaptured !== 'true') installD12InitialAnchorGuard(doc, win);
  const capturedInitialHash = anchorRoot?.dataset.d12InitialHashCaptured === 'true';
  const initialHash = capturedInitialHash ? anchorRoot.dataset.d12InitialHash : win.location.hash;

  const states = nodes.map(node => ({
    node,
    source: node.textContent,
    processedAttribute: node.getAttribute('data-processed'),
    rendered: false,
    inFlight: false,
    failed: false,
    lastVisible: false,
    errorNode: null,
  }));
  let initialAnchorTarget = null;
  let initialAnchorPending = false;
  let initialAnchorRestored = false;
  if (initialHash.length > 1) {
    try {
      const id = decodeURIComponent(initialHash.slice(1));
      const target = doc.getElementById(id);
      if (target && original.contains(target)) {
        initialAnchorTarget = target;
        initialAnchorPending = true;
      }
    } catch { /* malformed hash is not a valid source anchor */ }
  }
  if (anchorRoot?.dataset.d12InitialAnchorCanceled === 'true') initialAnchorPending = false;
  let disposed = false;
  let scheduled = false;
  let running = false;
  let renderAgain = false;
  let visibilityVersion = 0;
  const visibilityTargets = new Set([reader, reading, original]);
  const idleWaiters = [];
  const sourcePathIsOpen = node => {
    for (let current = node; current && current !== reader; current = current.parentElement) {
      if (current.hidden) return false;
      if (current.tagName === 'DETAILS' && !current.open) return false;
    }
    return node.isConnected;
  };
  const sourceIsVisible = node => {
    if (reader.dataset.krMode !== 'read' || reading.hidden || !sourcePathIsOpen(node)) return false;
    const rects = node.getClientRects?.();
    const rect = node.getBoundingClientRect?.();
    return Boolean(rects?.length && rect?.width > 0);
  };
  const hasRenderError = node => /Syntax error in text|mermaid version/i.test(node.textContent || '')
    || Boolean(node.querySelector('svg.error, .error-icon, .error-text, [data-mermaid-error]'))
    || !node.querySelector('svg');
  const removeError = state => {
    state.errorNode?.remove();
    state.errorNode = null;
  };
  const settleInitialAnchor = () => {
    initialAnchorPending = false;
    anchorRoot?.dispatchEvent(new win.Event('d12-initial-anchor-settled'));
  };
  if (!initialAnchorPending) settleInitialAnchor();
  const restoreInitialAnchor = () => {
    if (!initialAnchorPending || initialAnchorRestored || disposed) return;
    if (anchorRoot?.dataset.d12InitialAnchorCanceled === 'true' || win.location.hash !== initialHash) {
      settleInitialAnchor();
      return;
    }
    if (reader.dataset.krMode !== 'read' || reading.hidden) return;
    if (!initialAnchorTarget?.isConnected || !original.contains(initialAnchorTarget)) {
      settleInitialAnchor();
      return;
    }
    if (!sourcePathIsOpen(initialAnchorTarget)) return;
    const targetRect = initialAnchorTarget.getBoundingClientRect?.();
    if (!initialAnchorTarget.getClientRects?.().length || !(targetRect?.width > 0)) return;
    const visibleStates = states.filter(state => sourceIsVisible(state.node));
    if (visibleStates.some(state => !state.rendered && !state.failed)) return;
    initialAnchorRestored = true;
    settleInitialAnchor();
    initialAnchorTarget.scrollIntoView?.({ block: 'start' });
  };
  const restoreSource = state => {
    state.node.textContent = state.source;
    if (state.processedAttribute === null) state.node.removeAttribute('data-processed');
    else state.node.setAttribute('data-processed', state.processedAttribute);
    state.rendered = false;
  };
  const showError = state => {
    removeError(state);
    const notice = doc.createElement('p');
    notice.className = 'd12-mermaid-error';
    notice.dataset.d12MermaidError = '';
    notice.setAttribute('role', 'status');
    notice.textContent = '도식을 표시하지 못했습니다. 도식 원문을 확인할 수 있습니다.';
    state.node.insertAdjacentElement('afterend', notice);
    state.errorNode = notice;
  };
  const isIdle = () => !scheduled && !running && !renderAgain;
  const resolveIdle = () => {
    if (!isIdle()) return;
    restoreInitialAnchor();
    for (const resolve of idleWaiters.splice(0)) resolve();
  };
  const pump = async () => {
    if (disposed) {
      scheduled = false;
      renderAgain = false;
      settleInitialAnchor();
      resolveIdle();
      return;
    }
    scheduled = false;
    running = true;
    try {
      for (const state of states) {
        if (disposed) break;
        if (!sourceIsVisible(state.node) || state.rendered || state.failed) continue;
        const startVersion = visibilityVersion;
        state.inFlight = true;
        try {
          await mermaid.run({ nodes: [state.node] });
          if (disposed) {
            restoreSource(state);
            removeError(state);
            continue;
          }
          if (!sourceIsVisible(state.node) || startVersion !== visibilityVersion) {
            restoreSource(state);
            removeError(state);
            renderAgain = true;
            continue;
          }
          if (hasRenderError(state.node)) throw new Error('Mermaid returned an error SVG.');
          state.rendered = true;
          removeError(state);
        } catch {
          restoreSource(state);
          if (disposed) {
            removeError(state);
            continue;
          }
          if (sourceIsVisible(state.node) && startVersion === visibilityVersion) {
            state.failed = true;
            showError(state);
          } else {
            removeError(state);
            renderAgain = true;
          }
        } finally {
          state.inFlight = false;
        }
      }
    } finally {
      running = false;
      if (disposed) {
        scheduled = false;
        renderAgain = false;
        resolveIdle();
      } else if (renderAgain) {
        renderAgain = false;
        schedule();
      } else resolveIdle();
    }
  };
  const schedule = () => {
    if (disposed) return;
    if (running) { renderAgain = true; return; }
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(pump);
  };
  const syncVisibility = records => {
    if (disposed) return;
    const relevantRecords = records?.filter(record => visibilityTargets.has(record.target)) || [];
    if (running && relevantRecords.length) {
      visibilityVersion += relevantRecords.length;
      renderAgain = true;
    }
    let becameVisible = relevantRecords.length > 0;
    for (const state of states) {
      const visible = sourceIsVisible(state.node);
      if (visible !== state.lastVisible) {
        visibilityVersion += 1;
        state.lastVisible = visible;
        if (visible) becameVisible = true;
      }
      if (visible && relevantRecords.length && state.failed) {
        state.failed = false;
        removeError(state);
      }
      if (!visible) {
        state.failed = false;
        if (state.inFlight) restoreSource(state);
        removeError(state);
      }
    }
    if (becameVisible || (running && records?.length)) schedule();
    else resolveIdle();
  };

  const observer = new win.MutationObserver(records => syncVisibility(records));
  observer.observe(reader, { attributes: true, attributeFilter: ['class', 'data-kr-mode'] });
  observer.observe(reading, { attributes: true, attributeFilter: ['hidden'] });
  for (let current = original; current && current !== reader; current = current.parentElement) {
    if (current.tagName === 'DETAILS') {
      visibilityTargets.add(current);
      observer.observe(current, { attributes: true, attributeFilter: ['open'] });
    }
  }
  for (const details of original.querySelectorAll('details')) {
    visibilityTargets.add(details);
    // 절 선택은 접기 상태와 별개로 hidden을 바꾸므로 함께 감시한다.
    observer.observe(details, { attributes: true, attributeFilter: ['open', 'hidden'] });
  }
  const onResize = () => syncVisibility([{ type: 'resize' }]);
  win.addEventListener('resize', onResize);

  const controller = {
    whenIdle() {
      if (isIdle()) return Promise.resolve();
      return new Promise(resolve => idleWaiters.push(resolve));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scheduled = false;
      renderAgain = false;
      settleInitialAnchor();
      observer.disconnect();
      win.removeEventListener('resize', onResize);
      for (const state of states) {
        if (state.inFlight) restoreSource(state);
        removeError(state);
      }
      resolveIdle();
      initialized.delete(reader);
    },
  };
  initialized.set(reader, controller);
  syncVisibility();
  return controller;
}
