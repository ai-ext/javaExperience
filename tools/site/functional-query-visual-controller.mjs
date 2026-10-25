import { renderFunctionalQueryVisual } from './functional-query-visual.mjs';

const initialized = new WeakSet();
const read = (el, key) => JSON.parse(el.dataset[key] || '{}');

/** 초기화만 수행하며 자동 실행·fetch·storage 쓰기는 없다. */
export function initFunctionalQueryVisuals(doc = document) {
  for (const root of doc.querySelectorAll('[data-fqv]')) {
    if (initialized.has(root)) continue;
    initialized.add(root);
    const act = event => {
      const control = event.target.closest('[data-fqv-control], [data-fqv-action]');
      if (!control || control.closest('[data-fqv]') !== root) return;
      if (event.type === 'change' && !control.hasAttribute('data-fqv-control')) return;
      if (event.type === 'click' && !control.hasAttribute('data-fqv-action')) return;
      event.preventDefault(); event.stopPropagation();
      const ui = read(root, 'fqvControls');
      if (control.dataset.fqvControl) { ui[control.dataset.fqvControl] = control.value; ui.page = 0; }
      if (control.dataset.fqvAction === 'page') ui.page = Math.max(0, ui.page + (control.dataset.fqvValue === 'next' ? 1 : -1));
      if (control.dataset.fqvAction === 'request') ui.requestPreset = control.dataset.fqvValue;
      const workspace = root.closest('[data-fw-root]');
      const peers = workspace ? [...workspace.querySelectorAll('[data-fqv]')].filter(el => el.dataset.fqv === root.dataset.fqv) : [root];
      const focusKey = control.dataset.fqvControl;
      const focusAction = control.dataset.fqvAction;
      const focusValue = control.dataset.fqvValue;
      const isFocused = doc.activeElement === control;
      for (const peer of peers) {
        const advanced = peer.querySelector('.fqv-advanced')?.open;
        const next = renderFunctionalQueryVisual({ taskId: peer.dataset.fqv, stateId: peer.dataset.fqvState, idPrefix: peer.dataset.fqvPrefix, options: { ...read(peer, 'fqvOptions'), queryControls: ui } });
        const template = doc.createElement('template'); template.innerHTML = next;
        const replacement = template.content.firstElementChild;
        peer.replaceWith(replacement);
        if (advanced) replacement.querySelector('.fqv-advanced').open = true;
        if (peer === root && isFocused) {
          const controls = [...replacement.querySelectorAll('[data-fqv-control], [data-fqv-action]')];
          const target = controls.find(el => focusKey ? el.dataset.fqvControl === focusKey : el.dataset.fqvAction === focusAction && el.dataset.fqvValue === focusValue);
          // 끝 페이지에서 방금 누른 방향이 비활성화되면 반대 방향에 초점을 남긴다.
          const focusTarget = target?.disabled && focusAction === 'page'
            ? controls.find(el => el.dataset.fqvAction === 'page' && !el.disabled)
            : target;
          focusTarget?.focus({ preventScroll: true });
        }
      }
      initFunctionalQueryVisuals(doc);
    };
    root.addEventListener('change', act);
    root.addEventListener('click', act);
  }
}
