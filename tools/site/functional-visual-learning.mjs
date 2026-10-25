import { initFunctionalRuntimeVisuals } from './functional-runtime-visual-controller.mjs';
import { initFunctionalQueryVisuals } from './functional-query-visual-controller.mjs';
import { initFunctionalNewPostFocus } from './functional-new-post-focus.mjs';

// 전체 그림과 직접 비교를 같은 영역에서 전환한다. 학습 진도나 요청 입력은 건드리지 않는다.
export function initFunctionalVisualViews(doc = document, win = window) {
  for (const root of doc.querySelectorAll('[data-fw-visual]')) {
    if (root.dataset.fwViewInitialized) continue;
    root.dataset.fwViewInitialized = 'true';
    const overview = root.querySelector('[data-fw-overview]');
    const compare = root.querySelector('[data-fw-compare]');
    const buttons = [...root.querySelectorAll('[data-fw-view]')];
    if (!overview || !compare || buttons.length !== 2) {
      root.dataset.fwViewActive = 'compare';
      if (compare) compare.hidden = false;
      continue;
    }
    const panes = { overview, compare };
    function show(value, focus = false) {
      if (!Object.hasOwn(panes, value)) return;
      for (const button of buttons) {
        const selected = button.dataset.fwView === value;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (focus && selected) button.focus();
      }
      for (const [name, pane] of Object.entries(panes)) pane.hidden = name !== value;
      root.dataset.fwViewActive = value;
    }
    let mobile = win.innerWidth <= 760;
    try { if (typeof win.matchMedia === 'function') mobile = win.matchMedia('(max-width: 760px)').matches; } catch {}
    show(root.dataset.fwInitialView === 'compare' || mobile ? 'compare' : 'overview');
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => show(button.dataset.fwView));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        show(buttons[next].dataset.fwView, true);
      });
    });
    // 화면 너비가 바뀌어도 사용자가 고른 보기를 자동으로 뒤집지 않는다.
  }
}

export function initFunctionalVisualLearning(doc = document, win = window) {
  initFunctionalVisualViews(doc, win);
  initFunctionalRuntimeVisuals(doc);
  initFunctionalQueryVisuals(doc);
  initFunctionalNewPostFocus(doc, win);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initFunctionalVisualLearning(), { once: true });
  else initFunctionalVisualLearning();
}
